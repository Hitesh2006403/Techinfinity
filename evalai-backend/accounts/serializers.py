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
            "first_name",
            "last_name",
            "role",
            "date_joined",
            "is_staff",
        ]
        read_only_fields = ["id", "date_joined", "is_staff"]


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
    password_confirm = serializers.CharField(
        write_only=True,
        required=False,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "role",
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

    def validate_role(self, value):
        valid_roles = [User.Role.TEACHER, User.Role.STUDENT]
        if value not in valid_roles:
            raise serializers.ValidationError(
                f"Invalid role '{value}'. Must be either 'TEACHER' or 'STUDENT'."
            )
        return value

    def validate(self, attrs):
        if "password_confirm" in attrs:
            if attrs["password"] != attrs["password_confirm"]:
                raise serializers.ValidationError(
                    {"password_confirm": "Password confirmation does not match."}
                )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm", None)
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        # Automatically generate auth token for new user
        Token.objects.create(user=user)
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Validates user credentials and provides token upon successful login.
    Supports login with either username or email.
    """

    username = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True, write_only=True, style={"input_type": "password"}
    )

    def validate(self, attrs):
        login_input = attrs.get("username", "").strip()
        password = attrs.get("password")

        # Check if the login input is an email address
        user = None
        if "@" in login_input:
            try:
                user_obj = User.objects.get(email__iexact=login_input)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None
        else:
            user = authenticate(username=login_input, password=password)

        if not user:
            raise serializers.ValidationError(
                "Invalid login credentials. Please verify your username/email and password."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "This account has been deactivated. Please contact support."
            )

        token, _ = Token.objects.get_or_create(user=user)
        attrs["user"] = user
        attrs["token"] = token.key
        return attrs
