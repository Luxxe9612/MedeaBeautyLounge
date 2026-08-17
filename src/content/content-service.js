import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, functions, storage } from "../firebase";

const callableNames={gallery:["createGalleryItem","updateGalleryItem"],beforeAfter:["createBeforeAfterItem","updateBeforeAfterItem"]};
export async function loadContent(collectionName,{admin=false,legacyFallback=false}={}){const base=collection(db,collectionName);const q=admin?query(base,orderBy("order")):query(base,where("visible","==",true),where("active","==",true),orderBy("order"));try{const snap=await getDocs(q);return snap.docs.map(item=>({id:item.id,...item.data()}));}catch(error){if(!legacyFallback)throw error;const legacy=await getDocs(query(base,orderBy("createdAt","desc")));return legacy.docs.map((item,index)=>({id:item.id,order:index+1,visible:true,active:true,...item.data()}));}}
export async function saveContent(collectionName,id,data,{editing=false}={}){const name=callableNames[collectionName][editing?1:0];await httpsCallable(functions,name)({id,data});}
export async function archiveContent(collectionName,id){await httpsCallable(functions,"archiveContentItem")({collection:collectionName,id});}
export async function uploadContentImage(path,file){if(!["image/jpeg","image/png","image/webp"].includes(file.type))throw new Error("Formato non supportato: usa JPEG, PNG o WebP.");if(file.size>5*1024*1024)throw new Error("L’immagine supera 5 MiB.");const imageRef=ref(storage,path);await uploadBytes(imageRef,file,{contentType:file.type});return getDownloadURL(imageRef);}
export function contentId(){return `content-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;}
