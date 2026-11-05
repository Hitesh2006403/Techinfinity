from jinja2 import Environment


def environment(**options):
    """EvalAI's Jinja environment used for the compiled frontend shell."""
    return Environment(**options)
