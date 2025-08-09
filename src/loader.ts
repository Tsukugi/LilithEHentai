import {
    LilithHeaders,
    CustomFetch,
    RepositoryBase,
    RepositoryBaseProps,
    RepositoryBaseOptions,
    LilithLanguage,
} from "@atsu/lilith";
import { useEHentaiRepository } from "./ehentai";
import { UseDomParser } from "./interfaces/domParser";
import { useCheerioDomParser } from "./impl/useCheerioDomParser";
import { useNodeFetch } from "./impl/useNodeFetch";

export interface APILoaderConfigurations {
    headers?: Partial<LilithHeaders>;
    fetch: CustomFetch;
    domParser: UseDomParser;
    options: Partial<RepositoryBaseOptions>;
}

export const useLilithEHentai = (
    config: Partial<APILoaderConfigurations>,
): RepositoryBase => {
    const innerConfigurations: RepositoryBaseProps = {
        fetch: useNodeFetch,
        domParser: useCheerioDomParser,
        ...config,
        options: {
            debug: false,
            requiredLanguages: Object.values(LilithLanguage),
            ...config.options,
        },
    };

    return useEHentaiRepository(innerConfigurations);
};
