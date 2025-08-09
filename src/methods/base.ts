import {
    LilithLanguage,
    BookBase,
    LilithError,
    LilithImage,
    Sort,
} from "@atsu/lilith";

import { UseDomParserImpl } from "../interfaces/domParser";
import { EHentaiLanguage, EHentaiTag, GetGalleriesProps } from "../interfaces";
import { DateUtils } from "../utils/date";
import { RequestUtils } from "../utils/request";

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
export const useEHentaiMethods = () => {
    return {
        EHentaiPageResultSize,
        LanguageMapper,
        LanguageCodeMapper,
        extractLanguages,
        getLanguageFromTags,
        getGalleries,
        getTagsFromGallery,
    };
};
