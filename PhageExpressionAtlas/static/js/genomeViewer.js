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

        const gff = phage_genome.gffData;

        const blob = new Blob([gff], { type: "text/csv" });
        const url = URL.createObjectURL(blob);

        createGenomeViewer(url);
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

function createGenomeViewer(url){
    console.log(url);

    // embed(document.getElementById("genome-container"), {
    //     "tracks": [{
    //         "width": 500, 
    //         "height": 100, 
    //         "data": {
    //             // "url": "https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/UCSC.HG38.Human.CytoBandIdeogram.csv",
    //             "url": url, 
    //             "type": "csv",
    //             "chromosomeField": "Chromosome",
    //             "genomicFields": ["chromStart", "chromEnd"],
    //             "separator": ",",
    //         },

    //         "mark": "rect",
    //         "color": {
    //             "field": "Stain",
    //             "type": "nominal",
    //             "domain": ["gneg", "gpos25", "gpos50", "gpos75", "gpos100", "gvar"],
    //             "range": ["white", "#D9D9D9", "#979797", "#636363", "black", "#A0A0F2"]
    //         },

            
    //         "x": {"field": "chromStart", "type": "genomic" },
    //         "xe": { "field": "chromEnd", "type": "genomic" },
         
    //         "size": { "value": 20 },
    //         "stroke": { "value": "gray" },
    //         "strokeWidth": { "value": 0.5 }
    //     }]
    // });

    embed(document.getElementById("genome-container"), {
        "tracks": [{
            "width": 500, 
            "height": 100, 
            "data": {
                "url": url, 
                "type": "csv",
                "chromosomeField": "Sequence",
                "genomicFields": ["start", "end"],
            },

            "mark": "rect",
            "x": {"field": "start", "type": "genomic" },
            "xe": { "field": "end", "type": "genomic" },
         
            "size": { "value": 20 },
            "stroke": { "value": "gray" },
            "strokeWidth": { "value": 0.5 }
        }]
    });


}