// File storage service for receipts and attachments

// Convert file to base64
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

// Convert multiple files to base64
export const filesToBase64 = async (files) => {
    const fileArray = Array.from(files);
    const promises = fileArray.map(async (file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        data: await fileToBase64(file)
    }));

    return Promise.all(promises);
};

// Download file from base64
export const downloadFile = (base64Data, fileName) => {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Get file extension
export const getFileExtension = (fileName) => {
    return fileName.slice(((fileName.lastIndexOf('.') - 1) >>> 0) + 2);
};

// Check if file is an image
export const isImage = (fileName) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const extension = getFileExtension(fileName).toLowerCase();
    return imageExtensions.includes(extension);
};

// Get file icon based on type
export const getFileIcon = (fileName) => {
    const extension = getFileExtension(fileName).toLowerCase();

    if (isImage(fileName)) return '🖼️';
    if (extension === 'pdf') return '📄';
    if (['doc', 'docx'].includes(extension)) return '📝';
    if (['xls', 'xlsx'].includes(extension)) return '📊';
    if (['zip', 'rar', '7z'].includes(extension)) return '🗜️';

    return '📎';
};

// Format file size
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
