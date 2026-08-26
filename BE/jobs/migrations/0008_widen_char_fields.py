from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0007_job_company_link_widen_url_fields'),
    ]

    operations = [
        migrations.AlterField(
            model_name='job',
            name='title',
            field=models.CharField(max_length=500),
        ),
        migrations.AlterField(
            model_name='job',
            name='location',
            field=models.CharField(blank=True, max_length=500),
        ),
        migrations.AlterField(
            model_name='job',
            name='company_id',
            field=models.CharField(blank=True, max_length=128),
        ),
        migrations.AlterField(
            model_name='job',
            name='industry',
            field=models.CharField(blank=True, max_length=500),
        ),
        migrations.AlterField(
            model_name='job',
            name='function',
            field=models.CharField(blank=True, max_length=500),
        ),
        migrations.AlterField(
            model_name='job',
            name='job_type',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AlterField(
            model_name='job',
            name='employment_type',
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
