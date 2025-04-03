/*

  Herein, are  all Functions that are used on the Genome Viewer page 

*/
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

    toggleSpinner("genome-spinner", true);     // toggle the spinner on

    const phage_genome_names = await fetch_phage_genome_names(); // fetch phage genomes

    // get select elements
    const genome_select = document.getElementById("phages-select-viewer");
    const dataset_select = document.getElementById('dataset-select-viewer');
    const class_select = document.getElementById('classification-method');

    phage_genome_names.sort();     // sort options alphabetically 

    // fill select with options
    fillOptions(genome_select, phage_genome_names, phage_genome_names[0])

    // retrieve the initial genome value (genome select) & class Value (class select)
    let genomeValue = genome_select.shadowRoot.querySelector('input').value;
    let classValue = class_select.value; 

    // add eventlistener
    genome_select.addEventListener('sl-change', async() => {
        genomeValue = genome_select.shadowRoot.querySelector('input').value;

        // change the genome title
        const genomeTitle = document.getElementById("genome-title");
        genomeTitle.textContent = genomeValue;

        // fetch dataset names and fill options with them
        const datasets = await fetch_datasets_based_on_genome(genomeValue);
        fillOptions(dataset_select, datasets, datasets[0])
    });

    class_select.addEventListener('sl-change', async(event)=> {
        classValue = event.target.value;
        
        // dispatch an "sl-change" event for dataset_select to trigger event listeners
        dataset_select.dispatchEvent(new Event('sl-change', { bubbles: true }));
    } )

    dataset_select.addEventListener('sl-change', async() => {
        const dataset = dataset_select.shadowRoot.querySelector('input').value;
        
        const phageGenome = await fetch_specific_phage_genome(genomeValue, dataset);
        const gffJson = JSON.parse(phageGenome.gffData);

        createGenomeViewer(gffJson, classValue);
    });

    let timeout;

    window.addEventListener("resize", () => {
        // clear timeout (when one exists)
        clearTimeout(timeout);

        //set a timeout, so that the event is only triggered after some time, not with each resizing step
        timeout = setTimeout(function() {
            // dispatch an "sl-change" event for dataset_select to trigger redrawing genome viewer with new container size 
            dataset_select.dispatchEvent(new Event('sl-change', { bubbles: true }));
        }, 250)
        
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

function createGenomeViewer(json, classValue){
    // retrieve the assembly 
    // find the entry in the dictionary with the highest end value
    const maxLengthEntry = json.reduce((max, object) => object.end > max.end ? object : max, json[0]);
    const assembly = [[maxLengthEntry.seq_id, maxLengthEntry.end]];

    // get unique types
    let types = [...new Set(json.map(entry => entry.type))];
    types = types.filter(type => type !== "CDS" && type !== "gene");

    const container = document.getElementById("genome");

    embed(container, {
        "arrangement": "horizontal",
        "spacing": 40,
        "assembly": assembly,
        "style": {
            "outlineWidth": 1,
            "outline": "lightgray",
        },
        

        "views": [
            // circular view
            {
                "responsiveSize": true, 
                "layout": "circular", 
                "static": true,
                "centerRadius": 0.6, 
                "spacing": 5,
                "style": {
                    "outlineWidth": 1,
                    "outline": "lightgray"
                },
                "zoomLimits": [1000, maxLengthEntry.end + 100],

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
                            {
                                "mark": "rect",
                                "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene'] }, {"type": "filter", "field": "strand", "oneOf": ['+']},
                                {
                                    "type": "concat",
                                    "separator": "-",
                                    "newField": "start_end",
                                    "fields": ["start", "end"]
                                }],
                                "x": { "field": "start", "type": "genomic"}, 
                                "xe": { "field": "adjusted_end", "type": "genomic" },
                                "zoomLimits": [1000, maxLengthEntry.end + 100],
                        
                            },
                            // right triangle to indicate forward strand (+)
                            {
                                "mark": "triangleRight",
                                "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene'] }, {"type": "filter", "field": "strand", "oneOf": ['+']}],
                                "x": { "field": "adjusted_end", "type": "genomic"}, 
                                "xe": { "field": "end", "type": "genomic" },
                                "zoomLimits": [1000, maxLengthEntry.end + 100],
                            
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
                                "zoomLimits": [1000, maxLengthEntry.end + 100],
                                
                            },
                            // left triangle to indicate reverse strand (-)
                            {"mark": "triangleLeft",
                                "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene']}, {"type": "filter", "field": "strand", "oneOf": ['-']}],
                                "x": { "field": "start", "type": "genomic"}, 
                                "xe": { "field": "adjusted_start", "type": "genomic" },
                                "zoomLimits": [1000, maxLengthEntry.end + 100],
                                
                            },
                            {
                                "mark": "brush",
                                "x": {"linkingId": "linear-view"}, 
                                "color": {"value": "lightgray" },
                                "stroke": {"value": "gray"},
                                "strokeWidth": {"value": 1},
                                "opacity": {"value": 0.3},
                            
                            }
                            // {
                            //     "mark": "text", 
                            //     "text": { "field": "id", "type": "nominal" },
                            //     "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene'] }], 
                            //     "x": { "field": "start", "type": "genomic"}, 
                            //     "xe": { "field": "end", "type": "genomic" },
                            //     "visibility": [
                            //         {
                            //         "operation": "less-than",
                            //         "measure": "width",
                            //         "threshold": "|xe-x|",
                            //         "target": "mark"
                            //         }
                            //     ],


                            // },
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
                        "width": container.clientWidth/2,
                        

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
                        // tracks inside the gene biotype track
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
                                    // "range": ["darkslateblue"]
                                }, 
                                "zoomLimits": [1000, maxLengthEntry.end + 100],
                            },
                            // right triangle to indicate forward strand (+)
                            {
                                "mark": "triangleRight",
                                "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene'] }, {"type": "filter", "field": "strand", "oneOf": ['+']}],
                                "x": { "field": "adjusted_end", "type": "genomic"}, 
                                "xe": { "field": "end", "type": "genomic" },
                                "color": {
                                        "field": "gene_biotype",
                                        "type": "nominal",
                                        // "domain": ["-"],
                                        // "range": ["darkslateblue"],
                                    }, 
                                "zoomLimits": [1000, maxLengthEntry.end + 100],
                            },


                            // rectangle for reverse strand (-)
                            {
                                "mark": "rect",
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
                                "zoomLimits": [1000, maxLengthEntry.end + 100],
                            },
                            // left triangle to indicate reverse strand (-)
                            {
                                "mark": "triangleLeft",
                                "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene']}, {"type": "filter", "field": "strand", "oneOf": ['-']}],
                                "x": { "field": "start", "type": "genomic"}, 
                                "xe": { "field": "adjusted_start", "type": "genomic" },
                                "color": {
                                    "field": "gene_biotype",
                                    "type": "nominal",
                                    // "domain": ["-"],
                                    // "range": ["darkslateblue"],
                                }, 
                                "zoomLimits": [1000, maxLengthEntry.end + 100],
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
                        "height": 30, 
                        "width": container.clientWidth/2,
                    },
                    
                ],
                
            },
            
            //linear view
            {
                "linkingId": "linear-view", 
                "xDomain": {"interval": [0, 11000]},
                "layout": "linear", 
                "spacing": 5,
                "yOffset": ((container.clientWidth/2)/2)-90, // set to center linear view depending on height of circular view
                "style": {
                    "outlineWidth": 1,
                    "outline": "lightgray",
                },

                "data": {
                        "type": "json",
                        "chromosomeField": "seq_id",
                        "genomicFields": ["start", "end"],
                        "values": json,
                },
                "x": { "field": "start", "type": "genomic","linkingId": "linear-view"},
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
                            {
                                "mark": "rect",
                                "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene'] }, {"type": "filter", "field": "strand", "oneOf": ['+']},
                                {
                                    "type": "concat",
                                    "separator": "-",
                                    "newField": "start_end",
                                    "fields": ["start", "end"]
                                }],
                                "x": { "field": "start", "type": "genomic"}, 
                                "xe": { "field": "adjusted_end", "type": "genomic" },
                                "zoomLimits": [1000, maxLengthEntry.end + 100],
                        
                            },
                            // right triangle to indicate forward strand (+)
                            {
                                "mark": "triangleRight",
                                "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene'] }, {"type": "filter", "field": "strand", "oneOf": ['+']}],
                                "x": { "field": "adjusted_end", "type": "genomic"}, 
                                "xe": { "field": "end", "type": "genomic" },
                                "zoomLimits": [1000, maxLengthEntry.end + 100],
                            
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
                                "zoomLimits": [1000, maxLengthEntry.end + 100],
                                
                            },
                            // left triangle to indicate reverse strand (-)
                            {"mark": "triangleLeft",
                                "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene']}, {"type": "filter", "field": "strand", "oneOf": ['-']}],
                                "x": { "field": "start", "type": "genomic"}, 
                                "xe": { "field": "adjusted_start", "type": "genomic" },
                                "zoomLimits": [1000, maxLengthEntry.end + 100],
                                
                            },
                        ], 
                        "color": {
                            "field": classValue,
                            "type": "nominal",
                            "domain": ['early', 'middle', 'late'],
                            "range": [earlyCol, middleCol, lateCol],
                            "legend": true
                        },   
                        "style": { "background": "lightgray", "backgroundOpacity": 0.4 },
                        

                        "tooltip": [
                        {"field": "start_end", "type": "nominal", "alt": "Location"},
                        {"field": "gene_biotype", "type": "nominal", "alt": "Gene Biotype"},
                        {"field": "id", "type": "nominal", "alt": "ID"}, 
                        {"field": "locus_tag", "type": "nominal", "alt": "Locus Tag"}, 
                        {"field": "strand", "type": "nominal", "alt": "Strand"}
                        ],
                        "height": 70, 
                        "width": container.clientWidth/2 - 50,
                        

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
                        // tracks inside the gene biotype track
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
                                    "legend":true
                                }, 
                                "zoomLimits": [1000, maxLengthEntry.end + 100],
                            },
                            // right triangle to indicate forward strand (+)
                            {
                                "mark": "triangleRight",
                                "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene'] }, {"type": "filter", "field": "strand", "oneOf": ['+']}],
                                "x": { "field": "adjusted_end", "type": "genomic"}, 
                                "xe": { "field": "end", "type": "genomic" },
                                "color": {
                                        "field": "gene_biotype",
                                        "type": "nominal",
                                    }, 
                                "zoomLimits": [1000, maxLengthEntry.end + 100],
                            },


                            // rectangle for reverse strand (-)
                            {
                                "mark": "rect",
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
                                "zoomLimits": [1000, maxLengthEntry.end + 100],
                            },
                            // left triangle to indicate reverse strand (-)
                            {
                                "mark": "triangleLeft",
                                "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene']}, {"type": "filter", "field": "strand", "oneOf": ['-']}],
                                "x": { "field": "start", "type": "genomic"}, 
                                "xe": { "field": "adjusted_start", "type": "genomic" },
                                "color": {
                                    "field": "gene_biotype",
                                    "type": "nominal",
                                    // "domain": ["-"],
                                    // "range": ["darkslateblue"],
                                }, 
                                "zoomLimits": [1000, maxLengthEntry.end + 100],
                            },
                        ], 
                        
                        "tooltip": [
                        {"field": "start_end", "type": "nominal", "alt": "Location"},
                        {"field": "gene_biotype", "type": "nominal", "alt": "Gene Biotype"},
                        {"field": "id", "type": "nominal", "alt": "ID"}, 
                        {"field": "locus_tag", "type": "nominal", "alt": "Locus Tag"}, 
                        {"field": "strand", "type": "nominal", "alt": "Strand"}
                        ],
                        "style": { "background": "lightgray", "backgroundOpacity": 0.4 },
                        "height": 70, 
                        "width": container.clientWidth/2 - 50,
                    },
                    
                ],

            },
            
            
        ]
        
        
    }, { padding: 0});

    // hide the spinner
    toggleSpinner("spinner-container-viewer", false);
  

    // // show the gene classification legend 
    // const gene_legend = document.getElementById("gene-legend-container");
    // gene_legend.style.display = 'flex';

}