/**
 * Converts a File object to a Base64 encoded data URL.
 * @param file - The file to convert.
 * @returns A promise that resolves with the data URL string.
 */
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};
