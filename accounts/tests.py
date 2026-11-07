from django.contrib.auth import get_user_model
from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase
from accounts.management.commands.setup_demo_data import set_bootstrap_password


User = get_user_model()


class AccountsAuthTests(APITestCase):
    def setUp(self):
        self.teacher_register_url = reverse("accounts:register-teacher")
        self.student_register_url = reverse("accounts:register-student")
        self.login_url = reverse("accounts:login")
        self.me_url = reverse("accounts:current-user")
        self.logout_url = reverse("accounts:logout")

    def registration_payload(self, **overrides):
        data = {
            "username": "newstudent",
            "email": "newstudent@evalai.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "first_name": "New",
            "last_name": "Student",
        }
        data.update(overrides)
        return data

    def test_student_registration_forces_student_non_staff_role(self):
        response = self.client.post(
            self.student_register_url,
            self.registration_payload(role="TEACHER", is_staff=True, is_superuser=True),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="newstudent")
        self.assertEqual(user.role, User.Role.STUDENT)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.check_password("Password123!"))
        self.assertNotEqual(user.password, "Password123!")
        self.assertIn("token", response.data["data"])

    def test_teacher_registration_forces_teacher_role(self):
        response = self.client.post(
            self.teacher_register_url,
            self.registration_payload(
                username="newteacher",
                email="newteacher@evalai.com",
                role="STUDENT",
            ),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="newteacher")
        self.assertEqual(user.role, User.Role.TEACHER)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_registration_rejects_duplicate_email_and_mismatched_password(self):
        User.objects.create_user(
            username="existinguser",
            email="duplicate@evalai.com",
            password="Password123!",
            role=User.Role.STUDENT,
        )
        duplicate = self.client.post(
            self.student_register_url,
            self.registration_payload(email="duplicate@evalai.com"),
            format="json",
        )
        mismatch = self.client.post(
            self.student_register_url,
            self.registration_payload(
                username="differentuser",
                email="different@evalai.com",
                confirm_password="DifferentPassword123!",
            ),
            format="json",
        )

        self.assertEqual(duplicate.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", duplicate.data["errors"])
        self.assertEqual(mismatch.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("confirm_password", mismatch.data["errors"])

    def test_login_uses_email_and_returns_no_sensitive_user_fields(self):
        user = User.objects.create_user(
            username="testuser",
            email="testuser@evalai.com",
            password="SecretPassword123!",
            role=User.Role.TEACHER,
        )

        response = self.client.post(
            self.login_url,
            {"email": "TESTUSER@evalai.com", "password": "SecretPassword123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["user"]["id"], user.id)
        self.assertNotIn("password", response.data["data"]["user"])
        self.assertNotIn("is_staff", response.data["data"]["user"])
        self.assertTrue(Token.objects.filter(user=user).exists())

    def test_login_rejects_invalid_or_inactive_accounts(self):
        user = User.objects.create_user(
            username="inactiveuser",
            email="inactive@evalai.com",
            password="SecretPassword123!",
            role=User.Role.STUDENT,
            is_active=False,
        )
        inactive = self.client.post(
            self.login_url,
            {"email": user.email, "password": "SecretPassword123!"},
            format="json",
        )
        invalid = self.client.post(
            self.login_url,
            {"email": user.email, "password": "wrong"},
            format="json",
        )

        self.assertEqual(inactive.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)

    def test_me_requires_authentication_and_logout_invalidates_token(self):
        user = User.objects.create_user(
            username="meuser",
            email="me@evalai.com",
            password="Password123!",
            role=User.Role.STUDENT,
        )
        token = Token.objects.create(user=user)

        self.assertEqual(self.client.get(self.me_url).status_code, status.HTTP_401_UNAUTHORIZED)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        profile = self.client.get(self.me_url)
        logout = self.client.post(self.logout_url)

        self.assertEqual(profile.status_code, status.HTTP_200_OK)
        self.assertEqual(profile.data["data"]["username"], "meuser")
        self.assertEqual(logout.status_code, status.HTTP_200_OK)
        self.assertFalse(Token.objects.filter(user=user).exists())
        self.assertEqual(self.client.get(self.me_url).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_bootstrap_accounts_have_no_shared_default_password(self):
        user = User.objects.create_user(
            username="bootstrapuser",
            email="bootstrap@evalai.com",
            password=None,
            role=User.Role.TEACHER,
        )
        with patch.dict("os.environ", {"EVALAI_TEST_BOOTSTRAP_PASSWORD": ""}):
            set_bootstrap_password(user, "EVALAI_TEST_BOOTSTRAP_PASSWORD")
        self.assertFalse(user.has_usable_password())

    def test_bootstrap_password_is_only_set_when_explicitly_supplied(self):
        user = User.objects.create_user(
            username="configuredbootstrap",
            email="configured-bootstrap@evalai.com",
            password=None,
            role=User.Role.TEACHER,
        )
        with patch.dict("os.environ", {"EVALAI_TEST_BOOTSTRAP_PASSWORD": "Temporary-Test-Password-123!"}):
            set_bootstrap_password(user, "EVALAI_TEST_BOOTSTRAP_PASSWORD")
        self.assertTrue(user.check_password("Temporary-Test-Password-123!"))
