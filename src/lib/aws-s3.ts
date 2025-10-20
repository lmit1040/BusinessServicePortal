import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: import.meta.env.VITE_AWS_REGION || '',
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
  },
});

const bucket = import.meta.env.VITE_AWS_S3_BUCKET || '';
const cloudFrontDomain = import.meta.env.VITE_CLOUDFRONT_DOMAIN || '';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export const uploadFileToS3 = async (
  file: File,
  folder: string = 'uploads',
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  if (!bucket) {
    throw new Error('AWS S3 bucket not configured. Please set VITE_AWS_S3_BUCKET in .env');
  }

  if (!import.meta.env.VITE_AWS_REGION) {
    throw new Error('AWS region not configured. Please set VITE_AWS_REGION in .env');
  }

  if (!import.meta.env.VITE_AWS_ACCESS_KEY_ID || !import.meta.env.VITE_AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials not configured. Please set VITE_AWS_ACCESS_KEY_ID and VITE_AWS_SECRET_ACCESS_KEY in .env');
  }

  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${folder}/${timestamp}-${sanitizedFileName}`;

  if (onProgress) {
    onProgress({
      loaded: 0,
      total: file.size,
      percentage: 0,
    });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type,
    });

    await s3Client.send(command);

    if (onProgress) {
      onProgress({
        loaded: file.size,
        total: file.size,
        percentage: 100,
      });
    }

    if (cloudFrontDomain) {
      return `https://${cloudFrontDomain}/${key}`;
    }

    return `https://${bucket}.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${key}`;
  } catch (error: any) {
    console.error('S3 Upload Error:', error);

    if (error.name === 'NetworkingError' || error.message?.includes('fetch')) {
      throw new Error('Network error: Unable to connect to AWS S3. Please check:\n1. Your AWS credentials are correct\n2. Your S3 bucket has CORS configured\n3. Your internet connection is stable');
    }

    if (error.name === 'AccessDenied' || error.$metadata?.httpStatusCode === 403) {
      throw new Error('Access denied: Please check your AWS credentials and S3 bucket permissions');
    }

    if (error.name === 'InvalidAccessKeyId') {
      throw new Error('Invalid AWS Access Key ID. Please check your credentials in .env');
    }

    if (error.name === 'SignatureDoesNotMatch') {
      throw new Error('Invalid AWS Secret Access Key. Please check your credentials in .env');
    }

    throw new Error(`Failed to upload file: ${error.message || 'Unknown error'}`);
  }
};

export const deleteFileFromS3 = async (fileUrl: string): Promise<void> => {
  if (!bucket) {
    throw new Error('AWS S3 bucket not configured');
  }

  let key: string;

  if (fileUrl.includes(cloudFrontDomain)) {
    key = fileUrl.split(cloudFrontDomain + '/')[1];
  } else {
    const urlParts = fileUrl.split('.amazonaws.com/');
    key = urlParts[1] || fileUrl;
  }

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await s3Client.send(command);
};

export const listFilesInS3 = async (folder: string = 'uploads'): Promise<string[]> => {
  if (!bucket) {
    throw new Error('AWS S3 bucket not configured');
  }

  if (!import.meta.env.VITE_AWS_REGION) {
    throw new Error('AWS region not configured');
  }

  if (!import.meta.env.VITE_AWS_ACCESS_KEY_ID || !import.meta.env.VITE_AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials not configured');
  }

  try {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: folder + '/',
    });

    console.log('Listing S3 files in folder:', folder);
    const response = await s3Client.send(command);
    const files = response.Contents || [];
    console.log('Found', files.length, 'files in', folder);

    return files.map((file) => {
      if (cloudFrontDomain) {
        return `https://${cloudFrontDomain}/${file.Key}`;
      }
      return `https://${bucket}.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${file.Key}`;
    });
  } catch (error: any) {
    console.error('S3 List Error:', error);

    if (error.name === 'NetworkingError' || error.message?.includes('fetch')) {
      throw new Error('Network error: Unable to connect to AWS S3. Please check your internet connection and AWS configuration.');
    }

    if (error.name === 'AccessDenied' || error.$metadata?.httpStatusCode === 403) {
      throw new Error('Access denied: Please check your AWS credentials have ListBucket permissions');
    }

    if (error.name === 'InvalidAccessKeyId') {
      throw new Error('Invalid AWS Access Key ID');
    }

    if (error.name === 'SignatureDoesNotMatch') {
      throw new Error('Invalid AWS Secret Access Key');
    }

    if (error.name === 'NoSuchBucket') {
      throw new Error(`S3 bucket "${bucket}" does not exist`);
    }

    throw new Error(`Failed to list files: ${error.message || 'Unknown error'}`);
  }
};

export const getPresignedUrl = async (fileUrl: string, expiresIn: number = 3600): Promise<string> => {
  if (!bucket) {
    throw new Error('AWS S3 bucket not configured');
  }

  let key: string;

  if (fileUrl.includes(cloudFrontDomain)) {
    key = fileUrl.split(cloudFrontDomain + '/')[1];
  } else {
    const urlParts = fileUrl.split('.amazonaws.com/');
    key = urlParts[1] || fileUrl;
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};

export const isS3Configured = (): boolean => {
  return !!(
    import.meta.env.VITE_AWS_REGION &&
    import.meta.env.VITE_AWS_ACCESS_KEY_ID &&
    import.meta.env.VITE_AWS_SECRET_ACCESS_KEY &&
    import.meta.env.VITE_AWS_S3_BUCKET
  );
};
