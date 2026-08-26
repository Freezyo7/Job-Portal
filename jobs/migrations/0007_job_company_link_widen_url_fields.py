from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0006_job_is_remote'),
    ]

    operations = [
        # Synchronize Django's model state for company_link with Postgres
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AddField(
                    model_name='job',
                    name='company_link',
                    field=models.URLField(blank=True, max_length=2000),
                ),
            ],
            database_operations=[
                migrations.RunSQL(
                    sql='ALTER TABLE jobs_job ALTER COLUMN company_link TYPE varchar(2000);',
                    reverse_sql='ALTER TABLE jobs_job ALTER COLUMN company_link TYPE varchar(500);',
                ),
            ],
        ),

        # Widen all URL fields from varchar(500) to varchar(2000) for long URLs
        migrations.AlterField(
            model_name='job',
            name='url',
            field=models.URLField(max_length=2000),
        ),
        migrations.AlterField(
            model_name='job',
            name='apply_url',
            field=models.URLField(blank=True, max_length=2000),
        ),
        migrations.AlterField(
            model_name='job',
            name='company_logo',
            field=models.URLField(blank=True, max_length=2000),
        ),
    ]

