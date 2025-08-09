import { LilithLanguage, GetBook, Book } from "@atsu/lilith";
import { UseEHentaiMethodProps } from "../interfaces";
import { useLilithLog } from "../utils/log";
import { useEHentaiMethods } from "./base";
import { DateUtils } from "../utils/date";
import { RequestUtils } from "../utils/request";
import { PromiseTools } from "../utils/promise";

/**
 * Hook for interacting with EHentai books.
 * @param {UseEHentaiMethodProps} props - Properties required for the hook.
 * @returns {GetBook} - A function that retrieves information about a book based on its identifier.
 */
export const useEHentaiGetBookmethod = (
    props: UseEHentaiMethodProps,
): GetBook => {
    const {
        domains: { galleryBaseUrl },
        options: { debug },
        request,
    } = props;

    const { LanguageMapper, getTagsFromGallery } = useEHentaiMethods();

    const getImages = async (id: string): Promise<Book> => {
        const response = await request(`${galleryBaseUrl}/${id}`);
        const document = await response.getDocument();

        const coverSelector = "#gd1 div";
        const uri = RequestUtils.sanitizeImageSrc(
            extractUrl(document.find(coverSelector).getAttribute("style")),
        );

        const imagesSelector = "#gdt a";
        let images = document
            .findAll(imagesSelector)
            .map((image) => image.getAttribute("href"));

        const getGalleryTags = (type: string) =>
            getTagsFromGallery(type, document, ".gt");

        const totalPages: number = +Array.from(document.findAll(".gdt2"))
            .map((d) => d.getText())
            .find((d) => d.includes("pages"))
            .replace(" pages", "");

        if (totalPages > 20) {
            // This means we have multiple pages
            const pages = Math.ceil(totalPages / 20); // 52 pages should give 3 pages
            const promises = Array.from(new Array(pages - 1)) // We remove one as we already have the first
                .fill(null)
                .map((_, index) => async () => getNextPage(id, index + 1)); // We add one to start from the p = 1

            await PromiseTools.recursivePromiseChain({
                promises,
                onPromiseSettled: async (result) => {
                    images = [...images, ...result];
                },
            });
        }

        const tags = Array.from(document.findAll(".gtl1")).map((d) => ({
            id: d.getText(), //We really dont have ids it seems
            name: d.getText(),
        }));
        const title = document.find("h1#gn").getText();

        const artistTags = getGalleryTags("artist");
        const author: string =
            artistTags.length > 0 ? artistTags[0] : "unknown";

        const availableLanguages = getGalleryTags("language")
            .filter((d) => LanguageMapper[d] !== undefined) // Keep only valid keys
            .map((d) => LanguageMapper[d]) || [LilithLanguage.japanese]; // Convert keys to actual LilithLanguage objects // Fallback to Japanese if empty

        const language = availableLanguages[0];

        return {
            cover: { uri },
            title,
            tags,
            author,
            id,
            availableLanguages,
            savedAt: getEpoch(),
            chapters: [
                {
                    id,
                    title,
                    language,
                    chapterNumber: 1,
                    pages: images.map((i) => ({ uri: i })),
                    savedAt: getEpoch(),
                },
            ],
        };
    };

    const getNextPage = async (id: string, extraPage = 1) => {
        // Extra page is the page 2 onwards
        const response = await request(`${galleryBaseUrl}/${id}`, [
            ["p", extraPage],
        ]);
        const document = await response.getDocument();
        const imagesSelector = "#gdt a";
        const newPageImages = document
            .findAll(imagesSelector)
            .map((image) => image.getAttribute("href"));
        return newPageImages;
    };

    const extractUrl = (str: string) => {
        const regex = /url\((https?:\/\/[^\s]+)\)/;
        return str.match(regex) ? str.match(regex)[1] : null;
    };

    const { getEpoch } = DateUtils;

    /**
     * Retrieves information about a book based on its identifier.
     * @param {string} id - The unique identifier of the book.
     * @param {LilithLanguage[]} [requiredLanguages] - Optional array of required languages.
     * @returns {Promise<Book>} - A Promise that resolves to the retrieved book.
     * @throws {LilithError} - Throws an error if the book is not found or no translation is available for the requested language.
     */
    return async (id: string): Promise<Book> => {
        try {
            const book: Book = await getImages(id);
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
                savedAt: getEpoch(),
            };
        }
    };
};
