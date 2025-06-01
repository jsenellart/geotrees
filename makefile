PYTHON=python3
MANAGE=$(PYTHON) manage.py

.PHONY: run migrate makemigrations shell dbshell createsuperuser test collectstatic lint clean help

# Start the Django development server
run:
	$(MANAGE) runserver

# Apply database migrations
migrate:
	$(MANAGE) migrate

# Create new migrations
makemigrations:
	$(MANAGE) makemigrations

# Open the Django shell
shell:
	$(MANAGE) shell

# Open the database shell
dbshell:
	$(MANAGE) dbshell

# Create a superuser
createsuperuser:
	$(MANAGE) createsuperuser

# Run Django tests
test:
	$(MANAGE) test

# Collect static files
collectstatic:
	$(MANAGE) collectstatic --noinput

# Lint the code using pylint
lint:
	pylint geotrees

# Remove Python cache files
clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -exec rm -r {} +

# Show available commands
help:
	@echo "Available make commands:"
	@echo "  make run              -> Start the Django server"
	@echo "  make migrate          -> Apply database migrations"
	@echo "  make makemigrations   -> Create new migrations"
	@echo "  make shell            -> Open the Django shell"
	@echo "  make dbshell          -> Open the database shell"
	@echo "  make createsuperuser  -> Create a superuser"
	@echo "  make test             -> Run tests"
	@echo "  make collectstatic    -> Collect static files"
	@echo "  make lint             -> Lint the code with pylint"
	@echo "  make clean            -> Remove .pyc and __pycache__ files"
