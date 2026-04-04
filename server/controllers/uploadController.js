import ImageKit from 'imagekit';
import dotenv from 'dotenv';
dotenv.config();

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// @desc    Get ImageKit Authentication Parameters
// @route   GET /api/upload/auth
// @access  Private
export const getUploadAuth = (req, res) => {
    try {
        const result = imagekit.getAuthenticationParameters();
        res.json({
            ...result,
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
