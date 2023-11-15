import {
    CreateMultipartUploadCommand,
    UploadPartCommand,
    PutObjectCommand,
    CompleteMultipartUploadCommand,
    AbortMultipartUploadCommand,
    S3Client,
  } from "@aws-sdk/client-s3";
  import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";

  export const config = {
    api: {
        bodyParser: {
            sizeLimit: '1024mb' 
        }
    }
}
export default async function POST(req,res) {
    
  const file = req.body;
  

  if (!file) {
    return res.json({ ok:false })
  }
  const s3Client = new S3Client({
    region: "ap-south-1",
    credentials: fromCognitoIdentityPool({
      clientConfig: { region: "eu-north-1" },
      identityPoolId: "eu-north-1:6882a53f-ea7c-49cb-b0b6-bea5052ec264",
      
    }),
    
  
    
  });
  const bucketName = "theprintguy-customerfiles";
  const buffer = Buffer.from(file, "utf8");
//   console.log(buffer);
  const key = `multipart${Date.now()}`;

  let uploadId;

  try {
    const multipartUpload = await s3Client.send(
      new CreateMultipartUploadCommand({
        Bucket: bucketName,
        ExpectedBucketOwner:"200994887321",
        Key: key,
        
      }),
    );
// console.log(multipartUpload.UploadId);
    uploadId = multipartUpload.UploadId;

 
    const uploadPromises = [];
    
    let vl=Math.ceil(buffer.toString().length/(5*1024*1024));
    console.log(vl);
    const partSize = Math.ceil(buffer.length / vl);

    // Upload each part.
    for (let i = 0; i < vl; i++) {
      const start = i * partSize;
      const end = start + partSize;
      uploadPromises.push(
        s3Client
          .send(
            new UploadPartCommand({
              Bucket: bucketName,
              Key: key,
              ExpectedBucketOwner:"200994887321",
              UploadId: uploadId,
              Body: buffer.subarray(start, end),
              PartNumber: i + 1,
              
            }),
          )
          .then((d) => {
            console.log("Part", i + 1, "uploaded");
            return d;
          }),
      );
    }

    const uploadResults = await Promise.all(uploadPromises);
    await s3Client.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucketName,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: uploadResults.map(({ ETag }, i) => ({
            ETag,
            PartNumber: i + 1,
          })),
        },
      }));

    return res.json({ ok: true })

    // Verify the output by downloading the file from the Amazon Simple Storage Service (Amazon S3) console.
    // Because the output is a 25 MB string, text editors might struggle to open the file.
  } catch (err) {
    console.error(err);
    if (uploadId) {
        const abortCommand = new AbortMultipartUploadCommand({
          Bucket: bucketName,
          Key: key,
          UploadId: uploadId,
        });
  
        await s3Client.send(abortCommand);
      }
    }
}