import instantsearch from 'instantsearch.js';
import algoliasearch from 'algoliasearch';
import HitsWithContent from "./hits-with-content/hits-with-content";
import {
    clearRefinements,
    refinementList,
    stats,
    hits,
    pagination,
    voiceSearch,
    configure,
    index,
} from 'instantsearch.js/es/widgets';
import {
    connectRefinementList,
    connectQueryRules,
    connectCurrentRefinements,
    connectAutocomplete,
    connectSearchBox,
    connectHierarchicalMenu,
    connectHits,
} from 'instantsearch.js/es/connectors';
import { autocompleteSearchResult } from './autocomplete';

import {
    autocomplete,
    getAlgoliaResults,
    snippetHit,
} from '@algolia/autocomplete-js';
import { createQuerySuggestionsPlugin } from '@algolia/autocomplete-plugin-query-suggestions';
import { createLocalStorageRecentSearchesPlugin } from '@algolia/autocomplete-plugin-recent-searches';
import '@algolia/autocomplete-theme-classic';
import { carousel } from '../Homepage/displayCarousel';

export function searchResults() {
    const searchClient = algoliasearch(
        'HYDY1KWTWB',
        '28cf6d38411215e2eef188e635216508'
    );

    const search = instantsearch({
        indexName: 'gstar_demo_test',
        searchClient,
    });

    const renderRefinementList = (renderOptions, isFirstRender) => {
        const { items, refine, createURL, widgetParams } = renderOptions;

        if (isFirstRender) {
            const ul = document.createElement('ul');
            widgetParams.container.appendChild(ul);
        }

        widgetParams.container.querySelector('ul').innerHTML = items
            .map(
                item => `
                  <li style="${isRefined(item)}">
                    <a
                      href="${createURL(item.value)}"
                      data-value="${item.value}"
                      style="${isRefined(item)}"
                    >
                      ${item.label} <span style="${isRefined(item)}">(${item.count
                    })</span>
                    </a>
                  </li>
                `
            )
            .join('');

        [...widgetParams.container.querySelectorAll('a')].forEach(element => {
            element.addEventListener('click', event => {
                event.preventDefault();
                refine(event.currentTarget.dataset.value);
            });
        });
    };

    function isRefined(item) {
        if (item.isRefined) {
            return 'color: white !important; background-color: rgba(0,0,0, 0.9)';
        }
    }

    const renderQueryRuleCustomData = (renderOptions, isFirstRender) => {
        const { items, widgetParams, refine } = renderOptions;



        const checkBanner = items.map(item => {
            return item.banner
        })

        if (!checkBanner.includes(undefined)) {
            let banner = widgetParams.container
            banner.style.display = "block"
            widgetParams.container.innerHTML = `
            <div class="banner-wrapper">
              ${items
                    .map(
                        item =>
                            `<a href="${item.link}">
                            <div class="banner-overlay"></div>
                            <div class="banner-title--wrapper">
                                <h3>${item.title}</h3>
                                <div class="underline-bannerTitle"></div>
                            </div>
                            <img src="${item.banner}">
                        </a>`
                    )
                    .join('')}
            </div>
          `;
        } else {
            let banner = widgetParams.container
            banner.style.display = "none"
        }
    };

    const createDataAttribtues = refinement =>
        Object.keys(refinement)
            .map(key => `data-${key}="${refinement[key]}"`)
            .join(' ');

    const renderListItem = item => `
      ${item.refinements
            .map(
                refinement => `<li>${refinement.value.split('//')[0]} (${refinement.count
                    })
            <button ${createDataAttribtues(
                        refinement
                    )} class="btnCloseRefinements">X</button></li>`
            )
            .join('')}
`;

    const renderCurrentRefinements = (renderOptions, isFirstRender) => {
        const { items, widgetParams, refine } = renderOptions;
        document.querySelector('#current-refinements').innerHTML = `
    <ul class="currentRefinment-filters">
      ${items.map(renderListItem).join('')}
    </ul>
  `;

        [
            ...widgetParams.container.querySelectorAll('.btnCloseRefinements'),
        ].forEach(element => {
            element.addEventListener('click', event => {
                const item = Object.keys(event.currentTarget.dataset).reduce(
                    (acc, key) => ({
                        ...acc,
                        [key]: event.currentTarget.dataset[key],
                    }),
                    {}
                );

                refine(item);
            });
        });
    };

    const customRefinementList = connectRefinementList(renderRefinementList);
    const customQueryRuleCustomData = connectQueryRules(
        renderQueryRuleCustomData
    );
    const customCurrentRefinements = connectCurrentRefinements(
        renderCurrentRefinements
    );

    // search.addWidgets([
    //     customRefinementList({
    //         container: document.querySelector('#refinement-list-SearchResult'),
    //         attribute: 'keywords',
    //         showMoreLimit: 10,
    //     }),
    //     customQueryRuleCustomData({
    //         container: document.querySelector('#queryRuleCustomData'),
    //     }),
    //     customCurrentRefinements({
    //         container: document.querySelector('#current-refinements'),
    //     }),
    // ]);

    function createAutocompleteSearchBox() {
        const appId = 'HYDY1KWTWB';
        const apiKey = '28cf6d38411215e2eef188e635216508';
        const searchClient = algoliasearch(appId, apiKey);

        const recentSearchesPlugin = createLocalStorageRecentSearchesPlugin({
            key: 'search',
            limit: 3,
        });
        const querySuggestionsPlugin = createQuerySuggestionsPlugin({
            searchClient,
            indexName: 'gstar_demo_test_query_suggestions',
            getSearchParams() {
                return recentSearchesPlugin.data.getAlgoliaSearchParams({
                    hitsPerPage: 3,
                });
            },
        });
        // Use autocompleteRef to track the current autocomplete instance
        const autocompleteRef = { current: null };
        // Use indicesRef to track which index (or indices) to query using autocomplete
        const indicesRef = { current: [] };

        const renderAutocomplete = (renderOptions, isFirstRender) => {
            const { indices, refine } = renderOptions;

            // Store indices prop in indicesRef
            indicesRef.current = indices || [];
            // Instantiate autocomplete instance during the first render
            if (isFirstRender) {
                autocompleteRef.current = autocomplete({
                    container: '#autocomplete',
                    // debug: true,
                    openOnFocus: true,
                    plugins: [recentSearchesPlugin, querySuggestionsPlugin],

                    getSources({ query }) {
                        if (!query) {
                            return [];
                        }

                        return getAlgoliaResults({
                            searchClient,
                            queries: [
                                {
                                    query,
                                    indexName: 'gstar_demo_test',
                                    params: {
                                        hitsPerPage: 3,
                                        attributesToSnippet: ['name:10'],
                                        enablePersonalization: true,
                                    },
                                },
                            ],
                        }).then(async ([products]) => {
                            const [categories] = await searchClient.searchForFacetValues([
                                {
                                    indexName: 'gstar_demo_test',
                                    params: {
                                        facetName: 'name',
                                        facetQuery: query,
                                        highlightPreTag: '<mark>',
                                        highlightPostTag: '</mark>',
                                        maxFacetHits: 5,
                                        enablePersonalization: true,
                                    },
                                },
                                {
                                    indexName: 'gstar_demo_test',
                                    params: {
                                        facetName: 'category',
                                        facetQuery: query,
                                        highlightPreTag: '<mark>',
                                        highlightPostTag: '</mark>',
                                        maxFacetHits: 5,
                                        enablePersonalization: true,
                                    },
                                },
                            ]);

                            return [
                                {
                                    getItems() {
                                        return products.hits;
                                    },
                                    templates: {
                                        header() {
                                            return headerTemplate({ title: 'Products' });
                                        },
                                        item({ item }) {
                                            return productTemplate({
                                                image: item.image_link,
                                                title: snippetHit({ hit: item, attribute: 'name' }),
                                                description: item.description,
                                                price: item.price,
                                            });
                                        },
                                        footer() {
                                            return moreResultsTemplate({
                                                title: `See all products (${products.nbHits})`,
                                            });
                                        },
                                    },
                                },
                                // {
                                //     getItems() {
                                //         return brands.facetHits;
                                //     },
                                //     templates: {
                                //         header() {
                                //             return headerTemplate({ title: "Brands" });
                                //         },
                                //         item({ item }) {
                                //             return facetTemplate({ title: item.highlighted });
                                //         }
                                //     }
                                // },
                                {
                                    getItems() {
                                        return categories.facetHits;
                                    },
                                    templates: {
                                        header() {
                                            return headerTemplate({ title: 'Categories' });
                                        },
                                        item({ item }) {
                                            return facetTemplate({ title: item.highlighted });
                                        },
                                    },
                                },
                            ];
                        });
                    },
                    onSubmit({ root, sections, state }) {
                        refine(state.query);
                        // console.log(search.renderState.gstar_demo_test.stats.nbHits)
                        // console.log(hits.length)
                        // console.log(hits)
                        const noResultHits = search.renderState.gstar_demo_test.stats.nbHits;
                        if (noResultHits === 0) {
                            const noResultHits = search.renderState.gstar_demo_test.stats.nbHits;
                            noResult(noResultHits)
                        }
                    },
                });
                // During subsequent renders, refresh the autocomplete instance
            } else if (autocompleteRef.current) {
                autocompleteRef.current.refresh();
            }
        };

        return connectAutocomplete(renderAutocomplete);

        function headerTemplate({ title }) {
            return `
            <div class="aa-titleCategory">
                <h3>${title}</h3>
            </div>
            `;
        }

        function productTemplate({ image, title, description, price }) {
            return `
          <div class="aa-ItemContent">
            <div class="aa-ItemImage">
              <img src="${image}" alt="${title}">
            </div>
            <div class="aa-ItemInfos">
            <div class="aa-ItemTitle">${title}</div>
            <div class="aa-ItemPrice">$${price}</div>
            </div>
          </div>
        `;
        }

        function moreResultsTemplate({ title }) {
            return `
            <div class="aa-btnShowMore-wrapper">
                <a href="#" class="aa-btnShowMore">
                    ${title}
                </a>
          </div>
        `;
        }

        function facetTemplate({ title }) {
            return `
          <div class="aa-ItemContent">
            <div class="aa-ItemTitle">${title}</div>
          </div>
        `;
        }

        function noResult(noResultHits) {
            // let executed = false;
            // if (!executed) {
            //     executed = true;

            displayResultOrNoResult(noResultHits);
            const containerNoresult = document.querySelector('.container');
            const noResults = document.querySelector('.noResultMessage');
            const query = document.querySelector('.aa-InputWrapper input').value;
            const pagination = document.querySelector('#pagination');
            pagination.style.display = 'none';

            if (!noResults) {
                let noResults = document.createElement('div');
                noResults.innerHTML = '';
                noResults.classList.add('noResultMessage');
                noResults.innerHTML = `<p>Sorry no result for <span>${query}</span></p>
                <p>Please check the spelling or try to remove filters</p>
                <p>You can check our latest trends and collection bellow</p>`;
                containerNoresult.prepend(noResults);
            } else {
                noResults.innerHTML = '';
                noResults.classList.add('noResultMessage');
                noResults.innerHTML = `<p>Sorry no result for <span>${query}</span></p>
                <p>Please check the spelling or try to remove filters</p>
                <p>You can check our latest trends and collection bellow</p>`;
                containerNoresult.prepend(noResults);
            }

            const searchClient = algoliasearch(
                'HYDY1KWTWB',
                '28cf6d38411215e2eef188e635216508'
            );

            const search = instantsearch({
                indexName: 'gstar_demo_test',
                searchClient,
            });

            // const userTokenSelector = document.getElementById("user-token-selector");
            // userTokenSelector.addEventListener("change", () => {
            //     userTokenSelector.disabled = true;
            //     search.removeWidgets(carouselWidgets);
            //     getCarouselConfigs().then((carousels) => {
            //         console.log(carousels)
            //         userTokenSelector.disabled = false;
            //         carouselWidgets = createWidgets(carousels);
            //         search.addWidgets(carouselWidgets);
            //     });
            // });

            function getUserToken() {
                const getPersona = localStorage.getItem('personaValue');

                return getPersona;
            }

            //GET THE CONFIG
            function getCarouselConfigs() {
                return searchClient
                    .initIndex('gstar_demo_config')
                    .search('', {
                        facetFilters: ['userToken:' + getUserToken()],
                        attributesToHighlight: [],
                        attributesToRetrieve: ['title', 'indexName', 'configure'],
                    })
                    .then(res => res.hits);
            }

            //WIDGET CREATION
            let carouselWidgets = [];
            function createWidgets(carousels) {
                const container = document.querySelector('#stacked-carousels');

                container.innerText = '';

                return carousels.map(carouselConfig => {
                    const carouselContainer = document.createElement('div');
                    carouselContainer.className = 'carousel';

                    const indexWidget = index({
                        indexName: carouselConfig.indexName,
                        indexId: carouselConfig.objectID,
                    });

                    if (carouselConfig.configure) {

                        indexWidget.addWidgets([
                            configure({
                                ...carouselConfig.configure,
                                userToken: getUserToken(),
                            }),
                        ]);
                    }

                    indexWidget.addWidgets([
                        carousel({
                            title: carouselConfig.title,
                            container: carouselContainer,
                        }),
                    ]);

                    container.appendChild(carouselContainer);
                    return indexWidget;
                });
            }

            // retrieve the carousel configuration once
            getCarouselConfigs().then(carousels => {
                carouselWidgets = createWidgets(carousels);
                search.addWidgets(carouselWidgets);
                search.start();
            });
            // }
        }

        function displayResultOrNoResult(noResultHits) {
            const hitContainer = document.querySelector('#hitsResults');
            const hit = document.querySelector("#hits")
            const noResultCarousel = document.querySelector('#stacked-carousels');
            const noResultContainer = document.querySelector('.container');
            if (noResultHits === 0) {
                hitContainer.classList.remove('displayGrid');
                hitContainer.classList.add('displayFalse');
                noResultCarousel.classList.add('displayTrue');
                noResultCarousel.classList.remove('displayFalse');
                noResultContainer.classList.remove('displayFalse');
                noResultContainer.classList.add('displayTrue');
            } else {
                hitContainer.classList.add('displayGrid');
                hitContainer.classList.remove('displayFalse');
                noResultCarousel.classList.remove('displayGrid');
                noResultCarousel.classList.add('displayFalse');
                noResultContainer.classList.add('displayFalse');
                noResultContainer.classList.remove('displayTrue');
            }
        }
    }

    function displayPrice(hit) {
        if (hit.newPrice) {
            return `<p class="cross-price">$${hit.price}</p>
                    <p>$${hit.newPrice}</p>`
        } else {
            return `<p>$${hit.price}</p>`
        }
    }

    function displayEcoBadge(hit) {
        if (hit.badges) {
            let eco = hit.badges.eco
            if (eco) {
                return `<div class="badge badgeEco"><p>Eco</p></div>`
            } else { return `` }
        } else {
            return ``
        }
    }

    function displayOffBadge(hit) {
        if (hit.badges) {
            let off = hit.badges.off
            if (off) {
                let discount = (1 - (hit.newPrice / hit.price)) * 100
                discount = Math.floor(parseInt(discount, 10))
                console.log(discount)
                return `<div class="badge badgeOff">${discount}% Off</div>`
            } else {
                return ``
            }
        } else {
            return ``
        }
    }




    // function renderHitsAutocomplete(result) {
    //     const hits = result.hits;
    //     console.log(hits.length)

    //     if (hits.length != 0) {
    //         // displayResultOrNoResult(hits)
    //         const pagination = document.querySelector('#pagination');
    //         pagination.style.display = 'block';
    //         const hitContainer = document.querySelector('#hitsResults');
    //         hitContainer.innerHTML = hits
    //             .map(
    //                 hit =>
    //                     `
    //                 <li class="carousel-list-item">
    //                 <a href="${hit.url
    //                     }" class="product-searchResult" data-id="${hit.objectID}">
    //                     <div class="image-wrapper">
    //                         <img src="${hit.image_link}" align="left" alt="${hit.name
    //                     }" class="result-img" />
    //                         <div class="hit-sizeFilter">
    //                             <p>Sizes available: <span>${hit.sizeFilter
    //                     }</span></p>
    //                         </div>
    //                     </div>
    //                     <div class="hit-name">
    //                         <div class="hit-infos">
    //                             <div>${hit.name}</div>

    //                             <div class="colorWrapper">


    //                                     <div>${hit.hexColorCode ? hit.hexColorCode.split('//')[0] : ''
    //                     }</div>
    //                                     <div style="background: ${hit.hexColorCode ? hit.hexColorCode.split('//')[1] : ''
    //                     }" class="hit-colorsHex"></div>
    //                                 </div>


    //                             </div>
    //                         <div class="hit-price">
    //                             <p>$${hit.price}</p>
    //                             <p>$${hit.newPrice ? hit.newPrice : hit.price}</p>
    //                         </div>

    //                     </div>
    //                 </a>
    //             </li>
    //                 `
    //             )
    //             .join('');
    //     }
    // }

    const autocompleteSearchBox = createAutocompleteSearchBox();
    // const customHits = connectHits(renderHitsAutocomplete);

    const renderVirtualSearchBox = (renderOptions, isFirstRender) => {
        const { refine } = renderOptions;

        refine(search.renderState.gstar_demo_test.autocomplete.currentRefinement);
    };

    const virtualSearchBox = connectSearchBox(renderVirtualSearchBox);

    // const virtualHierarchicalMenu = connectHierarchicalMenu(() => { });
    search.addWidgets([
        index({
            indexName: 'gstar_demo_test',
        }).addWidgets([
            configure({
                hitsPerPage: 5,
            }),
            autocompleteSearchBox({
                container: '#autocomplete',
                placeholder: 'Search products',
            }),
            customRefinementList({
                container: document.querySelector('#refinement-list-SearchResult'),
                attribute: 'keywords',
                showMoreLimit: 10,
            }),
            customQueryRuleCustomData({
                container: document.querySelector('#banner'),
            }),
            customCurrentRefinements({
                container: document.querySelector('#current-refinements'),
            }),
        ]),
        clearRefinements({
            container: '#clear-refinements',
        }),
        refinementList({
            container: '#category-list',
            attribute: 'category',
        }),
        refinementList({
            container: '#gender-list',
            attribute: 'genderFilter',
        }),
        refinementList({
            container: '#hexColor-list',
            attribute: 'hexColorCode',
            transformItems(items) {
                return items.map(item => ({
                    ...item,
                    color: item.value.split('//')[1],
                    colorCode: item.value.split('//')[0],
                }));
            },
            templates: {
                item: `
                  <input type="color" value={{color}} class="colorInput" id="{{colorCode}}" {{#isRefined}}checked{{/isRefined}}/>
                  <label for="{{colorCode}}" class="{{#isRefined}}isRefined{{/isRefined}}">
                    {{colorCode}}
                    <span class="color" style="background-color: {{color}}"></span>
                  </label>`,
            },
        }),
        refinementList({
            container: '#size-list',
            attribute: 'sizeFilter',
        }),
        stats({
            container: '#stats-searchResult',
        }),
        voiceSearch({
            container: '#voicesearch',
            searchAsYouSpeak: true,
            language: 'en-US',
        }),
        new HitsWithContent({
            container: "#hits",
            templates: {
                item: hit => `
                <li class="carousel-list-item">
               
                <a href="${hit.url
                    }" class="product-searchResult" data-id="${hit.objectID}">
                    <div class="image-wrapper">
                        <img src="${hit.image_link}" align="left" alt="${hit.name
                    }" class="result-img" />
                    <div class="badgeWrapper">
                        <div>${displayEcoBadge(hit)}</div>
                        <div>${displayOffBadge(hit)}</div>
                    </div>
                        <div class="hit-sizeFilter">
                            <p>Sizes available: <span>${hit.sizeFilter
                    }</span></p>
                        </div>
                    </div>
                    <div class="hit-name">
                        <div class="hit-infos">
                            <div>${hit.name}</div>
                                
                            <div class="colorWrapper">
                                    <div>${hit.hexColorCode ? hit.hexColorCode.split('//')[0] : ''
                    }</div>
                                    <div style="background: ${hit.hexColorCode ? hit.hexColorCode.split('//')[1] : ''
                    }" class="hit-colorsHex"></div>
                                </div>
                                
                                
                            </div>
                            <div class="hit-price">
                            ${displayPrice(hit)}
                        </div>
                        
                    </div>
                </a>
            </li>
                `,
                injectedItem: hit => `
                 <li class="carousel-list-item">
                 
                        <div class="image-wrapper">
                            <img class="injectImg" src="${hit.image}" alt="">
                        </div>
                        <div class="btn-injection-content-wrapper">
                            <a class="btn-injection-content">Check it out</a>
                        </div>
                   
                  </li>
              `,
                noResults: response => `
                
              `
            },
            afterItemRenderer: (element, hit, response) => {
                const button = element.querySelector("button");

                if (button) {
                    button.addEventListener("click", event => {
                        event.stopPropagation();

                        // aa("clickedObjectIDsAfterSearch", {
                        //   eventName: "product_clicked",
                        //   index: "atis-prods",
                        //   queryID: response.queryID,
                        //   objectIDs: [hit.objectID],
                        //   positions: [hit.__position]
                        // });
                    });
                }
            }
        }),
        // customHits({
        //     container: document.querySelector('#hits'),
        // }),
        pagination({
            container: '#pagination',
        }),
        virtualSearchBox({ container: '#virtualSearch' }),
    ]);

    search.start();
}

