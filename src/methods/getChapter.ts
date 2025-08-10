import { GetChapter, Chapter } from "@atsu/lilith";
import { useEHentaiMethods } from "./base";
import { DateUtils } from "../utils/date";
import { UseEHentaiMethodProps } from "../interfaces";

/**
 * Hook for interacting with EHentai chapters.
 * @param {UseEHentaiMethodProps} props - Properties required for the hook.
 * @returns {GetChapter} - A function that retrieves information about a chapter based on its identifier.
 */
export const useEHentaiGetChapterMethod = (
    props: UseEHentaiMethodProps,
): GetChapter => {
    const { LanguageMapper, getBook } = useEHentaiMethods(props);

    const { getEpoch } = DateUtils;

    /**
     * Retrieves information about a chapter based on its identifier.
     * @param {string} chapterId - The unique identifier of the chapter.
     * @returns {Promise<Chapter>} - A Promise that resolves to the retrieved chapter.
     * @throws {LilithError} - Throws an error if the chapter is not found.
     */
    return async (chapterId: string): Promise<Chapter> => {
        try {
            const book = await getBook(chapterId); // They are the same as books
            return book.chapters[0];
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
