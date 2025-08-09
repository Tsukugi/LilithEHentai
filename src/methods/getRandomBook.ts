import { GetRandomBook, Book } from "@atsu/lilith";
import { useLilithLog } from "../utils/log";
import { DateUtils } from "../utils/date";

/**
 * Hook for retrieving a random book from EHentai.
 * @param {UseEHentaiMethodProps} props - Properties required for the hook.
 * @returns {GetRandomBook} - A function that retrieves a random book.
 */
export const useEHentaiGetRandomBookMethod = (): GetRandomBook => {
    const { getEpoch } = DateUtils;
    /**
     * Retrieves a random book from EHentai.
     * @param {number} [retry=0] - The number of times to retry if fetching a random book fails.
     * @returns {Promise<Book | null>} - A Promise that resolves to the retrieved random book or null if unsuccessful.
     * @throws {LilithError} - Throws an error if the random book cannot be fetched after the specified number of retries.
     */
    const getRandomBook = async (retry: number = 0): Promise<Book> => {
        try {
            useLilithLog(false).log(retry);
            /**
             * EHentai doesn't use chapters; it directly gets the pages from the book as 1 chapter books.
             */
            throw new Error("No chapter supported");
        } catch (error) {
            console.error(error);
            return {
                id: "",
                availableLanguages: [],
                title: "",
                chapters: [],
                author: "unknown",
                tags: [],
                cover: { uri: null },
                savedAt: getEpoch(),
            };
        }
    };

    return getRandomBook;
};
