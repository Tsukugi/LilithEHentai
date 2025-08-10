import {
    LilithLanguage,
    BookBase,
    LilithError,
    LilithImage,
    Sort,
    Book,
} from "@atsu/lilith";

import { UseDomParserImpl } from "../interfaces/domParser";
import {
    EHentaiLanguage,
    EHentaiTag,
    GetGalleriesProps,
    UseEHentaiMethodProps,
} from "../interfaces";
import { DateUtils } from "../utils/date";
import { RequestUtils } from "../utils/request";
import { PromiseTools } from "../utils/promise";

/*
 *  This is the size that will define a Page in Search
 */
export const MaxSearchSize = 20;
export const MaxLatestBooksSize = 20;

export const DefaultSearchOptions = {
    sort: Sort.Latest,
    page: 1,
    size: MaxSearchSize,
};

/**
 * The size of results per page in an EHentai search.
 */
const EHentaiPageResultSize = 20;

/**
 * Mapper that converts EHentai language codes to LilithLanguage enum values.
 */
const LanguageCodeMapper: Record<string, LilithLanguage> = {
    english: LilithLanguage.english,
    chinese: LilithLanguage.mandarin,
    japanese: LilithLanguage.japanese,
};

/**
 * Mapper that converts EHentaiLanguage enum values to LilithLanguage enum values.
 */
const LanguageMapper: Record<EHentaiLanguage, LilithLanguage> = {
    [EHentaiLanguage.english]: LilithLanguage.english,
    [EHentaiLanguage.japanese]: LilithLanguage.japanese,
    [EHentaiLanguage.chinese]: LilithLanguage.mandarin,
};

/**
 * Retrieves the EHentaiLanguage from a given array of EHentai tags.
 * @param {EHentaiTag[]} tags - Array of EHentai tags.
 * @returns {EHentaiLanguage} - EHentaiLanguage enum value.
 */
const getLanguageFromTags = (tags: EHentaiTag[]): EHentaiLanguage => {
    const filteredTag = tags.find(
        (tag) => tag.type === "language" && LanguageMapper[tag.name],
    );
    const result = filteredTag?.name || EHentaiLanguage.japanese;
    return result as EHentaiLanguage;
};

/**
 * Extracts LilithLanguage array from the given title string.
 * @param {string} title - Title string.
 * @returns {LilithLanguage[]} - Array of LilithLanguage values.
 */
const extractLanguages = (title: string): LilithLanguage[] => {
    const matches = title.toLowerCase().match(/\[(.*?)\]/g);
    const possibleLanguages = matches
        ? matches.map((match) => match.slice(1, -1))
        : [];
    const languages: LilithLanguage[] = possibleLanguages
        .filter((lang) => Object.keys(LanguageMapper).includes(lang))
        .map((lang) => LanguageMapper[lang]);

    return languages;
};

// Function to extract languages from a gallery element
const getLanguageFromAttribute = (el: UseDomParserImpl): LilithLanguage[] => {
    const languagesRetrieved = el
        .findAll("div.gl4e tbody div.gt")
        // Titles are usually "language:english" or "other: milf", so filter first
        .map((tag) => {
            const title = tag.getAttribute("title") || "test";
            return LanguageCodeMapper[title.replace("language:", "")] || null;
        })
        .filter((tag) => !!tag);
    return languagesRetrieved;
};

/**
 * Function for extracting galleries (books) from a parsed DOM document.
 *
 * @param {UseDomParserImpl} document - The parsed DOM document.
 * @param {LilithLanguage[]} requiredLanguages - The languages required for filtering galleries.
 * @returns {BookBase[]} - An array of book objects representing the extracted galleries.
 */
const getGalleries = ({ props, document }: GetGalleriesProps): BookBase[] => {
    if (!document) {
        throw new LilithError(
            404,
            "DOM Parser failed to find necessary elements needed for this process",
        );
    }
    // Extracting gallery elements from the container
    const galleries: UseDomParserImpl[] = document.findAll(
        "table.itg.glte > tbody > tr",
    ); // .glte needs sl: "dm_2" in the headers

    // Handling case where no galleries are found
    if (!galleries || galleries.length === 0) {
        throw new LilithError(404, "No search results found");
    }

    const getBookid = (href: string) => {
        let bookId = href?.replace(`${props.domains.galleryBaseUrl}/`, "");
        // Handle trailing slash (more readable than lastIndexOf)
        if (bookId && bookId.endsWith("/")) {
            bookId = bookId.slice(0, -1);
        }

        // Safely handle empty string → null
        bookId = bookId || null;

        return bookId;
    };
    // Filtering and mapping gallery elements to book objects
    return galleries
        .filter((el) => !!el.find("a")?.getAttribute("href"))
        .map((searchElement) => {
            try {
                const href = searchElement.find("a").getAttribute("href");

                const src =
                    searchElement.find("img")?.getAttribute("src") || null;

                const cover: LilithImage = {
                    uri: RequestUtils.sanitizeImageSrc(src),
                };

                const title: string =
                    searchElement.find(".glink")?.getText() || "";

                let availableLanguages: LilithLanguage[] =
                    getLanguageFromAttribute(searchElement);

                // If no languages are retrieved, try extracting from the title
                if (availableLanguages.length === 0)
                    availableLanguages = extractLanguages(title);
                if (availableLanguages.length === 0)
                    availableLanguages = [LilithLanguage.japanese];

                // Constructing and returning the book object
                return {
                    id: getBookid(href),
                    cover: cover,
                    title,
                    availableLanguages,
                    savedAt: DateUtils.getEpoch(),
                };
            } catch (error) {
                console.error(error);
            }
        });
};

const getTagsFromGallery = (
    type: string,
    root: UseDomParserImpl,
    selector: string,
): string[] => {
    return root
        .findAll(selector)
        .map((tag) => tag.getAttribute("id"))
        .filter((id) => id.includes(type))
        .map((id) =>
            id
                .replace(`td_${type}:`, "")
                .replace(".gt1", "")
                .replace("_", " |"),
        );
};

/**
 * EHentaiBase object containing various utilities related to EHentai integration.
 */
export const useEHentaiMethods = (props: UseEHentaiMethodProps) => {
    const {
        request,
        domains: { galleryBaseUrl },
    } = props;
    const { getEpoch } = DateUtils;

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

    const getBook = async (id: string): Promise<Book> => {
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
                    pages: await loadImages(images),
                    savedAt: getEpoch(),
                },
            ],
        };
    };

    /**
     * Method to get the image inside a single webpage
     * @param srcImage
     * @returns
     */
    const getImage = async (srcImage: string): Promise<string> => {
        const res = await request(srcImage);
        const document = await res.getDocument();

        const image = document.find("img#img").getAttribute("src");
        console.warn(image);
        return image;
    };

    const loadImages = async (images: string[]): Promise<LilithImage[]> => {
        const promises = images.map((i) => async () => await getImage(i));

        let scrappedImages: LilithImage[] = [];

        // Do it sequentially so you dont strain their servers
        await PromiseTools.recursivePromiseChain({
            promises,
            onPromiseSettled: async (result) => {
                scrappedImages = [...scrappedImages, { uri: result }];
            },
        });

        return scrappedImages;
    };

    return {
        EHentaiPageResultSize,
        LanguageMapper,
        LanguageCodeMapper,
        extractLanguages,
        getLanguageFromTags,
        getGalleries,
        getTagsFromGallery,
        getBook,
        loadImages,
    };
};
