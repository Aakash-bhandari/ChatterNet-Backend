import { GridFsStorage } from 'multer-gridfs-storage';
import multer from 'multer'
import dotenv from 'dotenv';

dotenv.config(); 

const Db_url = process.env.DB_URL;
const storage= new GridFsStorage({
    url:Db_url,
    options:{useNewUrlParser: true},
    file:(req,file)=>{
        const match=['image/png','image/jpg'];
        if(match.indexOf(file.memetype)===-1){
                return `${Date.now()}-blog-${file.originalname}`
        }
        return {
            bucketname:"photos",
            filename:`${Date.now()}-blog-${file.originalname}`
        }
    }

})
export default multer({ storage })
