from django.conf import settings
from django.core.management.base import BaseCommand

from submissions.tasks import fail_stuck_submissions


class Command(BaseCommand):
    help = "Mark submissions stuck in PROCESSING as FAILED so teachers can retry them."

    def add_arguments(self, parser):
        parser.add_argument(
            "--timeout-seconds",
            type=int,
            default=settings.SUBMISSION_STUCK_TIMEOUT_SECONDS,
        )

    def handle(self, *args, **options):
        result = fail_stuck_submissions.apply(
            kwargs={"timeout_seconds": options["timeout_seconds"]}
        ).get()
        self.stdout.write(
            self.style.SUCCESS(
                f"Marked {result['count']} stuck submission(s) as FAILED."
            )
        )
