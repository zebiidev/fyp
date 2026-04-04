import api from './api';

export const uploadImageToImageKit = async (file) => {
    const authRes = await api.get('/upload/auth');
    const { signature, expire, token: uploadToken, publicKey } = authRes.data;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', `${Date.now()}-${file.name}`);
    formData.append('publicKey', publicKey);
    formData.append('signature', signature);
    formData.append('expire', expire);
    formData.append('token', uploadToken);
    formData.append('useUniqueFileName', 'true');

    const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: formData
    });

    const payload = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) {
        throw new Error(payload?.message || 'Image upload failed');
    }

    return payload.url;
};
