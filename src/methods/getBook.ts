import { GetBook, Book } from "@atsu/lilith";
import { UseEHentaiMethodProps } from "../interfaces";
import { useLilithLog } from "../utils/log";
import { useEHentaiMethods } from "./base";
import { DateUtils } from "../utils/date";

/**
 * Hook for interacting with EHentai books.
 * @param {UseEHentaiMethodProps} props - Properties required for the hook.
 * @returns {GetBook} - A function that retrieves information about a book based on its identifier.
 */
export const useEHentaiGetBookmethod = (
    props: UseEHentaiMethodProps,
): GetBook => {
    const {
        options: { debug },
    } = props;

    const { getBook } = useEHentaiMethods(props);

    /**
     * Retrieves information about a book based on its identifier.
     * @param {string} id - The unique identifier of the book.
     * @param {LilithLanguage[]} [requiredLanguages] - Optional array of required languages.
     * @returns {Promise<Book>} - A Promise that resolves to the retrieved book.
     * @throws {LilithError} - Throws an error if the book is not found or no translation is available for the requested language.
     */
    return async (id: string): Promise<Book> => {
        try {
            const book: Book = await getBook(id);
            useLilithLog(debug).log({ book });
            return book;
        } catch (error) {
            console.error(error);
            return {
                title: "",
                id: "",
                author: "",
                tags: [],
                cover: { uri: "" },
                chapters: [],
                availableLanguages: [],
                savedAt: DateUtils.getEpoch(),
            };
        }
    };
};
