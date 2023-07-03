import { ELASTIC_INDEX_FIELDS } from 'src/grant/grant.constants';

type FilterArray = (
    | {
          bool: {
              must: {
                  bool: {
                      should:
                          | {
                                match_phrase: {
                                    [x: string]: string | object;
                                };
                            }
                          | {
                                range: {
                                    [x: string]: string | object;
                                };
                            };
                  };
              }[];
          };
      }
    | {
          multi_match: {
              query: string;
              operator: string;
              fuzziness: string;
              fields: ELASTIC_INDEX_FIELDS[];
          };
      }
)[];

export { FilterArray };
