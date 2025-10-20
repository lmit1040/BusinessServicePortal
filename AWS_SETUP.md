# AWS S3 and CloudFront Setup Guide

## Environment Variables

Add the following to your `.env` file:

```env
# AWS S3 Configuration
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=your_access_key_here
VITE_AWS_SECRET_ACCESS_KEY=your_secret_key_here
VITE_AWS_S3_BUCKET=your-bucket-name

# CloudFront Configuration (Optional)
VITE_CLOUDFRONT_DOMAIN=your-distribution.cloudfront.net
```

## S3 Bucket CORS Configuration

**IMPORTANT:** You must configure CORS on your S3 bucket to allow uploads from your web application.

### Steps to Configure CORS:

1. Go to AWS S3 Console
2. Select your bucket
3. Go to the "Permissions" tab
4. Scroll down to "Cross-origin resource sharing (CORS)"
5. Click "Edit"
6. Add the following CORS configuration:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-server-side-encryption",
            "x-amz-request-id",
            "x-amz-id-2"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

**For Production:** Replace `"*"` in `AllowedOrigins` with your actual domain(s):
```json
"AllowedOrigins": [
    "https://yourdomain.com",
    "https://www.yourdomain.com"
]
```

## S3 Bucket Policy

Your bucket should have a policy that allows public read access (optional, if you want files to be publicly accessible):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

## IAM User Permissions

Your IAM user (the one whose credentials you're using) needs the following permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::your-bucket-name",
                "arn:aws:s3:::your-bucket-name/*"
            ]
        }
    ]
}
```

## CloudFront Setup (Optional but Recommended)

CloudFront provides CDN capabilities for faster content delivery:

1. Create a CloudFront distribution
2. Set the origin to your S3 bucket
3. Note the distribution domain name (e.g., `d111111abcdef8.cloudfront.net`)
4. Add this domain to your `.env` file as `VITE_CLOUDFRONT_DOMAIN`

## Troubleshooting

### "Failed to fetch" Error
- Check that CORS is properly configured on your S3 bucket
- Verify your AWS credentials are correct
- Ensure your IAM user has the necessary permissions
- Check that your S3 bucket region matches the `VITE_AWS_REGION` value

### "Access Denied" Error
- Verify your IAM user has `s3:PutObject` permission
- Check that your bucket policy allows uploads

### "Invalid Access Key" Error
- Double-check your `VITE_AWS_ACCESS_KEY_ID` in `.env`
- Ensure there are no extra spaces or quotes

### Files Upload But Can't Be Viewed
- Make sure your bucket policy allows public read access (if needed)
- Or configure CloudFront with proper access controls

## Security Best Practices

1. **Never commit `.env` file to version control** - It's already in `.gitignore`
2. **Use IAM users with minimal permissions** - Only grant S3 access
3. **Rotate credentials regularly** - Update keys periodically
4. **Use CloudFront** - Provides additional security and performance benefits
5. **Restrict CORS origins in production** - Don't use `"*"` for `AllowedOrigins`
6. **Enable S3 versioning** - Protect against accidental deletions
7. **Monitor S3 access logs** - Track bucket usage and potential issues

## File Organization

The application organizes files into folders:
- `product-images/` - Product images (max 10MB)
- `product-videos/` - Product videos (max 100MB)

Files are automatically prefixed with timestamps to prevent naming conflicts.
