import { LilithError, RepositoryTemplate, UrlParamPair } from "@atsu/lilith";

import { Result } from "./interfaces/fetch";
import { useRequest } from "./utils/request";

import { useEHentaiGetBookmethod } from "./methods/getBook";
import { useEHentaiGetChapterMethod } from "./methods/getChapter";
import { useEHentaiSearchMethod } from "./methods/search";
import { useEHentaiGetRandomBookMethod } from "./methods/getRandomBook";
import { useEHentaiGetLatestBooksMethod } from "./methods/latest";
import { UseEHentaiMethodProps } from "./interfaces";
import { useEHentaiGetTrendingBooksMethod } from "./methods/getTrendingBooks";

export const useEHentaiRepository: RepositoryTemplate = (props) => {
    const { doRequest } = useRequest(props);

    const baseUrl = "https://e-hentai.org";
    const galleryBaseUrl = "https://e-hentai.org/g";
    const imgBaseUrl = "https://e-hentai.org/s";

    const request = async <T>(
        url: string,
        params: UrlParamPair[] = [],
    ): Promise<Result<T>> => {
        const response = await doRequest<T>(url, params, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0",
                cookie: "sl=dm_2", // This allows imgs to be in the DOM
            },
        });

        if (response.statusCode !== 200) {
            throw new LilithError(
                response.statusCode,
                JSON.stringify(response),
            );
        }

        return response;
    };

    const domains = { baseUrl, imgBaseUrl, galleryBaseUrl };
    const methodProps: UseEHentaiMethodProps = {
        ...props,
        domains,
        request,
    };

    return {
        domains,
        getChapter: useEHentaiGetChapterMethod(),
        getBook: useEHentaiGetBookmethod(methodProps),
        search: useEHentaiSearchMethod(methodProps),
        getRandomBook: useEHentaiGetRandomBookMethod(),
        getLatestBooks: useEHentaiGetLatestBooksMethod(methodProps),
        getTrendingBooks: useEHentaiGetTrendingBooksMethod(methodProps),
    };
};
