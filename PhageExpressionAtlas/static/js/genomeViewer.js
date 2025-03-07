import { embed } from 'gosling.js';

/**
 * Function to initialize the Genome Viewer
 */
export async function initializeViewerPage(){
    console.log("Viewer loaded")

    // fetch phage genomes
    const phage_genome_names = await fetch_phage_genome_names();


    // get select element
    const select = document.getElementById("phages-select-viewer");

    // sort options alphabetically 
    phage_genome_names.sort();

    // fill select with options
    fillOptions(select, phage_genome_names, phage_genome_names[0])

    // add eventlistener
    select.addEventListener('sl-change', async(event) => {
        var selectValue = select.shadowRoot.querySelector('input').value;
        
        const phage_genome = await fetch_specific_phage_genome(selectValue);

        const gff_json = JSON.parse(phage_genome.gffData);

        
        createGenomeViewer(gff_json);
    })
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

function createGenomeViewer(json){
    console.log(json);

    // retrieve the assembly 
    const lastEntry = json[json.length -1];
    const seqId = lastEntry.seq_id;
    const length = lastEntry.end;
    const assembly = [[seqId, length]]

    const types = [...new Set(json.map(entry => entry.type))];

    console.log(types)


    embed(document.getElementById("genome-container"), {
        // "layout": "circular", 
        // "centerRadius": 0.6, 
        // "spacing": 5, 
        "assembly": assembly,
        "tracks": [{
            "data": {
                "type": "json",
                "chromosomeField": "seq_id",
                "genomicFields": ["start", "end"],
                "values": json,
            },
            "x": { "field": "start", "type": "genomic" },
            "xe": { "field": "end", "type": "genomic" },
            "size": { "value": 20 },
            "stroke": { "value": "gray" },
            "strokeWidth": { "value": 0.5 }, 

            "alignment": "overlay",
            "tracks": [
                {
                    "mark": "rect",
                    "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene'], "not": true }],
                    "color": {
                        "field": "type",
                        "type": "nominal",
                        "domain": types,
                        "range": ["blue", "green", "orange", "yellow", "purple", "pink"]
                        },   
                    "tooltip": [
                    {"field": "start", "type": "genomic", "alt": "Start Position"},
                    {"field": "end", "type": "genomic", "alt": "End Position"},
                    {"field": "type", "type": "nominal", "alt": "Feature"},
                    {"field": "id", "type": "nominal", "alt": "ID"}

                    ],
                }, 
                {
                    "mark": "triangleRight", 
                    "dataTransform": [
                        { "type": "filter", "field": "type", "oneOf": ["CDS"] },
                        { "type": "filter", "field": "strand", "include": "+" }
                    ],
                    "color": { "value": "#B70101" }

                }
                // {
                //     "mark": "text", 
                //     "text": {"field": "id", "type": "nominal"},  
                //     "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene'], "not": true }],
                //     "visibility": [{
                //         "operation": "less-than",
                //         "measure": "width",
                //         "threshold": "|xe-x|",
                //         "target": "mark"
                //     }],
                //     "style": {"textStrokeWidth": 0 }

                // }

            ]
        }]
    });


}