import { embed } from 'gosling.js';


// retrieve the color variables 
const earlyCol = getComputedStyle(document.documentElement).getPropertyValue('--early').trim();
const middleCol = getComputedStyle(document.documentElement).getPropertyValue('--middle').trim();
const lateCol = getComputedStyle(document.documentElement).getPropertyValue('--late').trim();


/**
 * Function to initialize the Genome Viewer
 */
export async function initializeViewerPage(){
    console.log("Viewer loaded")

    // fetch phage genomes
    const phage_genome_names = await fetch_phage_genome_names();


    // get select element
    const genome_select = document.getElementById("phages-select-viewer");
    const dataset_select = document.getElementById('dataset-select-viewer');
    const class_select = document.getElementById('classification-method');

    // get all spinners and make them visible
    const spinners = document.querySelectorAll(".spinner");
    spinners.forEach(spinner => {
        toggleSpinner(spinner.id, true);
    })
    
    // sort options alphabetically 
    phage_genome_names.sort();

    // fill select with options
    fillOptions(genome_select, phage_genome_names, phage_genome_names[0])


    let genomeValue = genome_select.shadowRoot.querySelector('input').value;
    let classValue = class_select.value; 

    // add eventlistener
    genome_select.addEventListener('sl-change', async() => {
        genomeValue = genome_select.shadowRoot.querySelector('input').value;

        const genomeTitle = document.getElementById("genome-title");
        genomeTitle.textContent = genomeValue;

        const datasets = await fetch_datasets_based_on_genome(genomeValue);
        console.log(datasets)
        fillOptions(dataset_select, datasets, datasets[0])
    });

    class_select.addEventListener('sl-change', async(event)=> {
        classValue = event.target.value;
        console.log(classValue);
        // dispatch an "sl-change" event for dataset_select to trigger event listeners
        dataset_select.dispatchEvent(new Event('sl-change', { bubbles: true }));
    } )

    dataset_select.addEventListener('sl-change', async() => {
        const dataset = dataset_select.shadowRoot.querySelector('input').value;
        
        const phageGenome = await fetch_specific_phage_genome(genomeValue, dataset);
        const gffJson = JSON.parse(phageGenome.gffData);

        createGenomeViewer(gffJson, classValue, spinners);
    });

    window.addEventListener("resize", () => {
        // dispatch an "sl-change" event for dataset_select to trigger redrawing genome viewer
        dataset_select.dispatchEvent(new Event('sl-change', { bubbles: true }));
    });
}

/**
 * Function to fill a single selector for Phage-Host Interaction
 * @param {sl-select} select - select element.
 * @param {string[]} options - Options for the select element.
 * @param {string} defaultValue - Default Value for the select element.
 */
function fillOptions(select, options, defaultValue) {

    // clear existing options
    select.innerHTML = ''; 

    options.forEach(option => {
    
      // remove whitespaces and replace them with underscores for value attribute
      const optionUnderscore = option.replace(/\s+/g, '_');

      // create option element, change value/text content and append to select element
      const opt = document.createElement('sl-option');
      opt.value = optionUnderscore;
      opt.textContent = option;
      select.appendChild(opt);
    });


    // change default value
    if(defaultValue){

        setTimeout(() => {
            setValueAndTriggerChange(select, defaultValue);
        }, 10);
    }
}


/**
 * Function that sets the value of an select element and triggers an sl-change event
 * @param {sl-select} select - select element.
 * @param {string} value - Value for the select element.
 */
async function setValueAndTriggerChange(select, value) {

    await select.updateComplete;  // wait for Shoelace to render the component

    if(select.hasAttribute('multiple')){
        select.value = value
    }else{
        select.value = value.replace(/\s+/g, '_');
        select.shadowRoot.querySelector('input').value = value;
    }

    // dispatch an "sl-change" event to trigger event listeners
    select.dispatchEvent(new Event('sl-change', { bubbles: true }));
}

function createGenomeViewer(json, classValue, spinners){
    // retrieve the assembly 
    // find the entry in the dictionary with the highest end value
    const maxLengthEntry = json.reduce((max, object) => object.end > max.end ? object : max, json[0]);
    const assembly = [[maxLengthEntry.seq_id, maxLengthEntry.end]];

    // get unique types
    let types = [...new Set(json.map(entry => entry.type))];
    types = types.filter(type => type !== "CDS" && type !== "gene");

    const container = document.getElementById("genome");

    embed(container, {
        "responsiveSize": true, 
        "layout": "circular", 
        "centerRadius": 0.6, 
        "spacing": 5,
        "width": container.clientWidth,
        "height": container.clientHeight,
        "assembly": assembly,
        "style": {
            "outlineWidth": 1,
            "outline": "lightgray"
        },

        "data": {
                "type": "json",
                "chromosomeField": "seq_id",
                "genomicFields": ["start", "end"],
                "values": json,
        },
        "x": { "field": "start", "type": "genomic" },
        "xe": { "field": "end", "type": "genomic" },
        "stroke": { "value": "gray"},


        
        "tracks": [
            // gene track with classification 
            {
                "title": 'Gene Classification',
                "alignment": "overlay",
                "data": {
                "type": "json",
                "chromosomeField": "seq_id",
                "genomicFields": ["start", "end"],
                "values": json,
                },
                // tracks inside the Gene Classification track
                "tracks": [
                    
                    // rectangle for forward strand (+)
                    {"mark": "rect",
                        "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene'] }, {"type": "filter", "field": "strand", "oneOf": ['+']},
                        {
                            "type": "concat",
                            "separator": "-",
                            "newField": "start_end",
                            "fields": ["start", "end"]
                          }],
                        "x": { "field": "start", "type": "genomic"}, 
                        "xe": { "field": "adjusted_end", "type": "genomic" },
                  
                    },
                    // right triangle to indicate forward strand (+)
                    {"mark": "triangleRight",
                    "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene'] }, {"type": "filter", "field": "strand", "oneOf": ['+']}],
                    "x": { "field": "adjusted_end", "type": "genomic"}, 
                    "xe": { "field": "end", "type": "genomic" },
                    },

                    // rectangle for reverse strand (-)
                    {"mark": "rect",
                        "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene']}, {"type": "filter", "field": "strand", "oneOf": ['-']}, {
                            "type": "concat",
                            "separator": "-",
                            "newField": "start_end",
                            "fields": ["start", "end"]
                          }],
                        "x": { "field": "adjusted_start", "type": "genomic"}, 
                        "xe": { "field": "end", "type": "genomic" },
                        
                    },
                    // left triangle to indicate reverse strand (-)
                    {"mark": "triangleLeft",
                        "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene']}, {"type": "filter", "field": "strand", "oneOf": ['-']}],
                        "x": { "field": "start", "type": "genomic"}, 
                        "xe": { "field": "adjusted_start", "type": "genomic" },
                        
                    },
                ], 
                "color": {
                    "field": classValue,
                    "type": "nominal",
                    "domain": ['early', 'middle', 'late'],
                    "range": [earlyCol, middleCol, lateCol],
                },   
                "style": {"legendTitle": "Gene Classification"},

                "tooltip": [
                {"field": "start_end", "type": "nominal", "alt": "Location"},
                {"field": "gene_biotype", "type": "nominal", "alt": "Gene Biotype"},
                {"field": "id", "type": "nominal", "alt": "ID"}, 
                {"field": "locus_tag", "type": "nominal", "alt": "Locus Tag"}, 
                {"field": "strand", "type": "nominal", "alt": "Strand"}
                ],
                "height": 20, 
                "width": container.clientWidth,
                

            },

            // gene track with gene biotype coloring 
            {
                "title": 'Gene Biotypes',
                "alignment": "overlay",
                "data": {
                "type": "json",
                "chromosomeField": "seq_id",
                "genomicFields": ["start", "end"],
                "values": json,
                },
                // tracks inside the CDS track
                "tracks": [
                    
                    // rectangle for forward strand (+)
                    {"mark": "rect",
                        "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene'] }, {"type": "filter", "field": "strand", "oneOf": ['+']},
                        {
                            "type": "concat",
                            "separator": "-",
                            "newField": "start_end",
                            "fields": ["start", "end"]
                          }],
                        "x": { "field": "start", "type": "genomic"}, 
                        "xe": { "field": "adjusted_end", "type": "genomic" },
                        "color": {
                            "field": "gene_biotype",
                            "type": "nominal",
                            // "domain": ["-"],
                            // "range": ["darkslateblue"],
                            "legend": true,
                        }, 
                    },
                    // right triangle to indicate forward strand (+)
                    {"mark": "triangleRight",
                    "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene'] }, {"type": "filter", "field": "strand", "oneOf": ['+']}],
                    "x": { "field": "adjusted_end", "type": "genomic"}, 
                    "xe": { "field": "end", "type": "genomic" },
                    "color": {
                            "field": "gene_biotype",
                            "type": "nominal",
                            // "domain": ["-"],
                            // "range": ["darkslateblue"],
                        }, 
                    },

                    // rectangle for reverse strand (-)
                    {"mark": "rect",
                        "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene']}, {"type": "filter", "field": "strand", "oneOf": ['-']}, {
                            "type": "concat",
                            "separator": "-",
                            "newField": "start_end",
                            "fields": ["start", "end"]
                          }],
                        "x": { "field": "adjusted_start", "type": "genomic"}, 
                        "xe": { "field": "end", "type": "genomic" },
                        "color": {
                            "field": "gene_biotype",
                            "type": "nominal",
                            // "domain": ["-"],
                            // "range": ["darkslateblue"],
                        }, 
                    },
                    // left triangle to indicate reverse strand (-)
                    {"mark": "triangleLeft",
                        "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene']}, {"type": "filter", "field": "strand", "oneOf": ['-']}],
                        "x": { "field": "start", "type": "genomic"}, 
                        "xe": { "field": "adjusted_start", "type": "genomic" },
                        "color": {
                            "field": "gene_biotype",
                            "type": "nominal",
                            // "domain": ["-"],
                            // "range": ["darkslateblue"],
                        }, 
                    },
                ], 
                
                "tooltip": [
                {"field": "start_end", "type": "nominal", "alt": "Location"},
                {"field": "gene_biotype", "type": "nominal", "alt": "Gene Biotype"},
                {"field": "id", "type": "nominal", "alt": "ID"}, 
                {"field": "locus_tag", "type": "nominal", "alt": "Locus Tag"}, 
                {"field": "strand", "type": "nominal", "alt": "Strand"}
                ],
                
                "style": {"legendTitle": "Gene Biotype",},
                "height": 20, 
                "width": container.clientWidth,
            },




            // CDS track
            // {
            //     "title": 'CDS',
            //     "alignment": "overlay",
            //     "data": {
            //     "type": "json",
            //     "chromosomeField": "seq_id",
            //     "genomicFields": ["start", "end"],
            //     "values": json,
            //     },
            //     // tracks inside the CDS track
            //     "tracks": [
                    
            //         // rectangle for forward strand (+)
            //         {"mark": "rect",
            //             "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['CDS'] }, {"type": "filter", "field": "strand", "oneOf": ['+']},
            //             {
            //                 "type": "concat",
            //                 "separator": "-",
            //                 "newField": "start_end",
            //                 "fields": ["start", "end"]
            //               }],
            //             "x": { "field": "start", "type": "genomic"}, 
            //             "xe": { "field": "adjusted_end", "type": "genomic" },
            //             "color": {
            //                 "field": "strand",
            //                 "type": "nominal",
            //                 "domain": ["+"],
            //                 "range": ["darkslateblue"],
            //             },   
            //         },
            //         // right triangle to indicate forward strand (+)
            //         {"mark": "triangleRight",
            //         "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['CDS'] }, {"type": "filter", "field": "strand", "oneOf": ['+']}],
            //         "x": { "field": "adjusted_end", "type": "genomic"}, 
            //         "xe": { "field": "end", "type": "genomic" },
            //         "color": {
            //                 "field": "strand",
            //                 "type": "nominal",
            //                 "domain": ["+"],
            //                 "range": ["darkslateblue"],
            //             },
            //         },

            //         // rectangle for reverse strand (-)
            //         {"mark": "rect",
            //             "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['CDS']}, {"type": "filter", "field": "strand", "oneOf": ['-']}, {
            //                 "type": "concat",
            //                 "separator": "-",
            //                 "newField": "start_end",
            //                 "fields": ["start", "end"]
            //               }],
            //             "x": { "field": "adjusted_start", "type": "genomic"}, 
            //             "xe": { "field": "end", "type": "genomic" },
            //             "color": {
            //                 "field": "strand",
            //                 "type": "nominal",
            //                 "domain": ["-"],
            //                 "range": ["darkslateblue"],
            //             }, 
            //         },
            //         // left triangle to indicate reverse strand (-)
            //         {"mark": "triangleLeft",
            //             "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['CDS']}, {"type": "filter", "field": "strand", "oneOf": ['-']}],
            //             "x": { "field": "start", "type": "genomic"}, 
            //             "xe": { "field": "adjusted_start", "type": "genomic" },
            //             "color": {
            //                 "field": "strand",
            //                 "type": "nominal",
            //                 "domain": ["-"],
            //                 "range": ["darkslateblue"],
            //             }, 
            //         },
            //         // {
            //         //     // rest of the features like tRNA, repeat regions, etc.
            //         //     "mark": "rect",
            //         //     "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene', 'CDS'], "not": true }],
            //         //     "x": { "field": "start", "type": "genomic"}, 
            //         //     "xe": { "field": "end", "type": "genomic" },
        
            //         //     "color": {
            //         //         "field": "type",
            //         //         "type": "nominal",
            //         //         "domain": types,
            //         //         "range": ["green", "orange", "yellow", "purple", "pink"],
            //         //         "legend": true,
        
            //         //         },   
            //         //     "tooltip": [
            //         //         {"field": "start", "type": "genomic", "alt": "Start Position"},
            //         //         {"field": "end", "type": "genomic", "alt": "End Position"},
            //         //         {"field": "type", "type": "nominal", "alt": "Feature"},
            //         //         {"field": "id", "type": "nominal", "alt": "ID"},
            //         //         {"field": "strand", "type": "nominal", "alt": "Strand"}
            //         //     ],
                        
            //         // }, 
            //     ], 
                
            //     "tooltip": [
            //     {"field": "start_end", "type": "nominal", "alt": "Location"},
            //     {"field": "product", "type": "nominal", "alt": "Function"},
            //     {"field": "id", "type": "nominal", "alt": "ID"}, 
            //     {"field": "locus_tag", "type": "nominal", "alt": "Locus Tag"}, 
            //     {"field": "strand", "type": "nominal", "alt": "Strand"}
            //     ],
            //     "height": 20

            // },

            // rest of the features like tRNA, repeat regions, etc.
            // {
            //     "title": 'Features',
            //     "mark": "rect",
            //     "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene', 'CDS'], "not": true }, {
            //         "type": "concat",
            //         "separator": "-",
            //         "newField": "start_end",
            //         "fields": ["start", "end"]
            //       } ],

            //     "color": {
            //         "field": "type",
            //         "type": "nominal",
            //         "domain": types,
            //         "range": ["steelblue", "sandybrown", "darkgoldenrod", "mediumpurple", "paleviolet"],
            //         "legend": true,

            //         },   
            //     "tooltip": [
            //         {"field": "start_end", "type": "nominal", "alt": "Location"},
            //         {"field": "type", "type": "nominal", "alt": "Feature"},
            //         {"field": "id", "type": "nominal", "alt": "ID"},
            //         {"field": "strand", "type": "nominal", "alt": "Strand"}
            //     ],
            //     height: 20,
            // }, 
            // {
            //     // Gene biotypes like tRNA, protein coding, etc.
            //     "title": 'Features',
            //     "mark": "rect",
            //     "dataTransform": [ {"type": "filter", "field": "gene_biotype", "oneOf": [null], 'not': true},{"type": "concat", "separator": "-", "newField":         "start_end", "fields": ["start", "end"]
            //     }],

            //     "color": {
            //         "field": "gene_biotype",
            //         "type": "nominal",
            //         // "domain": types,
            //         // "range": ["steelblue", "sandybrown", "darkgoldenrod", "mediumpurple", "paleviolet"],
            //         "legend": true,
            //         },   
            //     "tooltip": [
            //         {"field": "start_end", "type": "nominal", "alt": "Location"},
            //         {"field": "gene_biotype", "type": "nominal", "alt": "Biotype"},
            //         {"field": "id", "type": "nominal", "alt": "ID"},
            //         {"field": "strand", "type": "nominal", "alt": "Strand"}
            //     ],
            //     height: 20,
            // }, 
            
        ],
        
        
    }, { padding: 0});


    spinners.forEach(spinner => {
        toggleSpinner(spinner.id, false);
    })
}