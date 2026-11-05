from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from unfold.admin import ModelAdmin
from unfold.decorators import display
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm

User = get_user_model()


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm

    list_display = (
        "username",
        "email",
        "full_name_display",
        "role_badge",
        "is_staff",
        "is_active",
        "date_joined",
    )

    list_filter = (
        "role",
        "is_staff",
        "is_superuser",
        "is_active",
        "date_joined",
    )

    search_fields = (
        "username",
        "first_name",
        "last_name",
        "email",
    )

    ordering = ("-date_joined",)
    list_per_page = 25

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (
            _("Personal Info"),
            {"fields": ("first_name", "last_name", "email", "role")},
        ),
        (
            _("Permissions & Roles"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
                "classes": ["collapse"],
            },
        ),
        (_("Important Dates"), {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "email",
                    "role",
                    "password",
                    "password_confirm",
                    "is_staff",
                    "is_active",
                ),
            },
        ),
    )

    @display(description=_("Full Name"))
    def full_name_display(self, obj: User) -> str:
        return obj.get_full_name() or "-"

    @display(
        description=_("Role"),
        label={
            "TEACHER": "info",
            "STUDENT": "success",
        },
    )
    def role_badge(self, obj: User) -> str:
        return obj.role

    def get_fieldsets(self, request, obj=None):
        """Only superusers may view or assign the superuser flag."""
        fieldsets = super().get_fieldsets(request, obj)
        if request.user.is_superuser:
            return fieldsets

        restricted = []
        for title, options in fieldsets:
            fields = tuple(
                field
                for field in options.get("fields", ())
                if field != "is_superuser"
            )
            options = {**options, "fields": fields}
            restricted.append((title, options))
        return restricted

    def get_readonly_fields(self, request, obj=None):
        if obj and not request.user.is_superuser:
            return (*super().get_readonly_fields(request, obj), "is_superuser")
        return super().get_readonly_fields(request, obj)

    def save_model(self, request, obj, form, change):
        # Do not permit a staff user with change-user permission to privilege
        # escalate via a crafted admin POST.
        if change and not request.user.is_superuser:
            obj.is_superuser = User.objects.only("is_superuser").get(
                pk=obj.pk
            ).is_superuser
        elif not change and not request.user.is_superuser:
            obj.is_superuser = False
        super().save_model(request, obj, form, change)
