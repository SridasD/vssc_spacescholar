export const MAX_FILE_SIZE = parseInt(
  process.env.MAX_FILE_SIZE || `${200 * 1024 * 1024}`
); // Default to 200MB
export const FOLDER_NAME = process.env.FOLDER_NAME || "uploaded_files";
export const BOOK_PHYSICAL_LOCATION =
  process.env.BOOK_PHYSICAL_LOCATION || "physicalbook.book";
  
