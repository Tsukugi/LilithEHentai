import { GetChapter, Chapter } from "@atsu/lilith";
import { useEHentaiMethods } from "./base";
import { DateUtils } from "../utils/date";

/**
 * Hook for interacting with EHentai chapters.
 * @param {UseEHentaiMethodProps} props - Properties required for the hook.
 * @returns {GetChapter} - A function that retrieves information about a chapter based on its identifier.
 */
export const useEHentaiGetChapterMethod = (): GetChapter => {
    const { LanguageMapper } = useEHentaiMethods();

    const { getEpoch } = DateUtils;

    /**
     * Retrieves information about a chapter based on its identifier.
     * @param {string} chapterId - The unique identifier of the chapter.
     * @returns {Promise<Chapter>} - A Promise that resolves to the retrieved chapter.
     * @throws {LilithError} - Throws an error if the chapter is not found.
     */
    return async (chapterId: string): Promise<Chapter> => {
        try {
            /**
             * EHentai doesn't use chapters; it directly gets the pages from the book as 1 chapter books.
             */
            throw new Error("No chapter supported");
        } catch (error) {
            console.error(error);
            return {
                id: chapterId,
                language: LanguageMapper.english,
                title: "",
                chapterNumber: 1,
                pages: [],
                savedAt: getEpoch(),
            };
        }
    };
};
