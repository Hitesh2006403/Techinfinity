from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework.authtoken.models import Token

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Public representation of User profile.
    """

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "role",
            "first_name",
            "last_name",
        ]
        read_only_fields = fields


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for registering new accounts (Teachers & Students).
    """

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "confirm_password",
            "first_name",
            "last_name",
        ]
        extra_kwargs = {
            "email": {"required": True},
            "first_name": {"required": False, "allow_blank": True},
            "last_name": {"required": False, "allow_blank": True},
        }

    def validate_email(self, value):
        normalized_email = value.strip().lower()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError(
                "A user with this email address already exists."
            )
        return normalized_email

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Password confirmation does not match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        password = validated_data.pop("password")
        role = self.context.get("role")
        if role not in (User.Role.TEACHER, User.Role.STUDENT):
            raise serializers.ValidationError("A registration role is required.")
        # The view, rather than request data, is the sole authority for roles and
        # elevated account flags on public registration.
        validated_data.update(
            role=role,
            is_staff=False,
            is_superuser=False,
        )
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        # Automatically generate auth token for new user
        Token.objects.create(user=user)
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Validates user credentials and provides token upon successful login.
    Uses email and password; usernames are never used as an authentication
    identifier by this public endpoint.
    """

    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True, write_only=True, style={"input_type": "password"}
    )

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        password = attrs.get("password")

        try:
            user_obj = User.objects.get(email__iexact=email)
            user = authenticate(username=user_obj.username, password=password)
        except User.DoesNotExist:
            user = None

        if not user:
            raise serializers.ValidationError(
                "Invalid email or password."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "This account has been deactivated. Please contact support."
            )

        token, _ = Token.objects.get_or_create(user=user)
        attrs["user"] = user
        attrs["token"] = token.key
        return attrs
