import fileUpload from 'express-fileupload';
import {
    CreateMultipartUploadCommand,
    UploadPartCommand,
    PutObjectCommand,
    CompleteMultipartUploadCommand,
    AbortMultipartUploadCommand,
    S3Client,
  } from "@aws-sdk/client-s3";
  import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
const middleware = fileUpload();
export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req, res) => {
  middleware(req, res, async () => {
    if (req.method === 'POST') {
      try {
        const file = req.files.file;
        if(!file)
        {
            return res.status(404).json({ok:false,message:"file not found"});
        }
        if(file.size>2*1024*1024*1024)
        {
            return res.status(500).json({ok:false,message:"maximum file size is upto 2 gb"});
        }
        let key=`${Date.now()}+${file.name}`;
        const s3Client = new S3Client({
            region: "ap-south-1",
            credentials: fromCognitoIdentityPool({
              clientConfig: { region: "eu-north-1" },
              identityPoolId: "eu-north-1:6882a53f-ea7c-49cb-b0b6-bea5052ec264",
              
            }),  
             
          });
          const bucketName = "theprintguy-customerfiles";
          let uploadId;

  try {
    const multipartUpload = await s3Client.send(
      new CreateMultipartUploadCommand({
        Bucket: bucketName,
        ExpectedBucketOwner:"200994887321",
        Key: key,
        
      }),
    );

    uploadId = multipartUpload.UploadId;

    const byteData=await file.data;
    const buffer = Buffer.from(byteData);
    const uploadPromises = [];
    
    const partSize = 5*1024*1024;


    for (let i = 0; i < Math.ceil(buffer.length / partSize); i++) {
      const start = i * partSize;
      const end = Math.min((i + 1) * partSize, buffer.length);
      let part =   buffer.slice(start, end);
      uploadPromises.push(
        s3Client
          .send(
            new UploadPartCommand({
              Bucket: bucketName,
              Key: key,
              ExpectedBucketOwner:"200994887321",
              UploadId: uploadId,
              Body: part,
              
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




  } catch (err) {
    if (uploadId) {
        const abortCommand = new AbortMultipartUploadCommand({
          Bucket: bucketName,
          Key: key,
          UploadId: uploadId,
        });
        console.log(err);
        await s3Client.send(abortCommand);
      }
      return res.status(500).json({ok:false,message:"Internal server error"});

    }
        res.status(200).json({ ok:true });
      } catch (error) {
        console.log(error);
        return res.status(500).json({ok:false,message:"Internal server error"});
    }
    } else {
        return res.status(500).json({ok:false,message:"Internal server error"});
    }
  });
};

export default handler;
