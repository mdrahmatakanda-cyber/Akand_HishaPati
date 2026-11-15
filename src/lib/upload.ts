import { supabase } from './supabase';

// ==========================================
// ১. ছবি WebP-তে কনভার্ট করার ফাংশন
// ==========================================
const convertToWebP = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/')) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); resolve(file); return; }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' }));
        else resolve(file);
      }, 'image/webp', 0.8); // ৮০% কোয়ালিটি
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
};

// ==========================================
// ২. ছবি Supabase-এ আপলোড (অটো WebP)
// ==========================================
export const uploadImageToSupabase = async (file: File, folder: string = 'images'): Promise<string> => {
  // ছবিকে WebP-তে কনভার্ট করা
  const webpFile = await convertToWebP(file);
  
  // ইউনিক ফাইল নাম তৈরি
  const fileName = `${folder}/${Date.now()}-${webpFile.name}`;
  
  // Supabase Storage-এ আপলোড
  const { error } = await supabase.storage.from('hishabpati-files').upload(fileName, webpFile);
  if (error) throw new Error(error.message);

  // পাবলিক URL বের করা
  const { data: urlData } = supabase.storage.from('hishabpati-files').getPublicUrl(fileName);
  return urlData.publicUrl;
};

// ==========================================
// ৩. PDF Upstash-এ আপলোড
// ==========================================
export const uploadPdfToUpstash = async (file: File): Promise<{ fileKey: string; url: string }> => {
  // ৩ MB সাইজ চেক
  if (file.size > 3 * 1024 * 1024) {
    throw new Error('PDF ফাইলের সাইজ ৩ মেগাবাইটের বেশি হতে পারবে না!');
  }

  // FormData তৈরি করে Edge Function-এ পাঠানো
  const formData = new FormData();
  formData.append('file', file);

  const { data, error } = await supabase.functions.invoke('upload-pdf', {
    body: formData,
  });
  
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);

  // ডাটাবেসে সেভ করার জন্য fileKey এবং url রিটার্ন করছে
  return { fileKey: data.fileKey, url: data.url }; 
};

// ==========================================
// ৪. Upstash থেকে প্রাইভেট ফাইলের লিংক আনা
// ==========================================
export const getUpstashFileUrl = async (fileKey: string): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('get-upstash-file-url', {
    body: { fileKey }
  });
  
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);

  return data.url;
};