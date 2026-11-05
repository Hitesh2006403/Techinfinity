from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class AccountsAuthTests(APITestCase):
    def setUp(self):
        self.register_url = reverse("accounts:register")
        self.login_url = reverse("accounts:login")
        self.me_url = reverse("accounts:current-user")

    def test_student_registration(self):
        """Test registering a new student account."""
        data = {
            "username": "newstudent",
            "email": "newstudent@evalai.com",
            "password": "Password123!",
            "password_confirm": "Password123!",
            "first_name": "New",
            "last_name": "Student",
            "role": "STUDENT",
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertIn("token", response.data["data"])
        self.assertEqual(response.data["data"]["user"]["role"], "STUDENT")
        self.assertTrue(User.objects.filter(username="newstudent").exists())

    def test_teacher_registration(self):
        """Test registering a new teacher account."""
        data = {
            "username": "newteacher",
            "email": "newteacher@evalai.com",
            "password": "Password123!",
            "password_confirm": "Password123!",
            "first_name": "New",
            "last_name": "Teacher",
            "role": "TEACHER",
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["user"]["role"], "TEACHER")

    def test_duplicate_email_registration_fails(self):
        """Test that registering with duplicate email is rejected."""
        User.objects.create_user(
            username="existinguser",
            email="duplicate@evalai.com",
            password="Password123!",
            role="STUDENT",
        )
        data = {
            "username": "anotheruser",
            "email": "duplicate@evalai.com",
            "password": "Password123!",
            "role": "STUDENT",
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])

    def test_login_with_username_and_email(self):
        """Test authentication via username and email."""
        user = User.objects.create_user(
            username="testuser",
            email="testuser@evalai.com",
            password="SecretPassword123",
            role="TEACHER",
        )

        # Login with username
        resp_username = self.client.post(
            self.login_url,
            {"username": "testuser", "password": "SecretPassword123"},
        )
        self.assertEqual(resp_username.status_code, status.HTTP_200_OK)
        self.assertTrue(resp_username.data["success"])
        self.assertIn("token", resp_username.data["data"])

        # Login with email
        resp_email = self.client.post(
            self.login_url,
            {"username": "testuser@evalai.com", "password": "SecretPassword123"},
        )
        self.assertEqual(resp_email.status_code, status.HTTP_200_OK)
        self.assertTrue(resp_email.data["success"])

    def test_login_invalid_password(self):
        """Test login fails with incorrect password."""
        User.objects.create_user(
            username="wrongpassuser",
            email="wrong@evalai.com",
            password="CorrectPassword123",
            role="STUDENT",
        )
        response = self.client.post(
            self.login_url,
            {"username": "wrongpassuser", "password": "BadPassword"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])

    def test_current_user_profile(self):
        """Test /api/auth/me/ returns authenticated user's profile."""
        user = User.objects.create_user(
            username="meuser",
            email="me@evalai.com",
            password="Password123!",
            role="STUDENT",
        )
        # Unauthenticated request
        unauth_resp = self.client.get(self.me_url)
        self.assertEqual(unauth_resp.status_code, status.HTTP_401_UNAUTHORIZED)

        # Authenticated request
        self.client.force_authenticate(user=user)
        auth_resp = self.client.get(self.me_url)
        self.assertEqual(auth_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(auth_resp.data["data"]["user"]["username"], "meuser")
