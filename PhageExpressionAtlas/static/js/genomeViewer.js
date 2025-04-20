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
    const early_select = document.getElementById("early-select");
    const middle_select = document.getElementById("middle-select");
    const late_select = document.getElementById("late-select");
    const threshold_input = document.getElementById("custom-threshold");

        

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

        // reset custom threshold inputs/selects
        early_select.innerHTML = '';
        middle_select.innerHTML = '';
        late_select.innerHTML = '';
        threshold_input.innerHTML = '';

        //reset classification selection
        // const classification_method = document.getElementById("classification-method-exploration");
        // classification_method.value = "ClassMax";
    });

    class_select.addEventListener('sl-change', async(event)=> {
        classValue = event.target.value;
        
        // dispatch an "sl-change" event for dataset_select to trigger event listeners
        dataset_select.dispatchEvent(new Event('sl-change', { bubbles: true }));
    } )

    dataset_select.addEventListener('sl-change', async() => {
        const dataset = dataset_select.shadowRoot.querySelector('input').value;
        const custom_div = document.querySelector(".custom-threshold-container");

        // reset custom threshold inputs/selects
        early_select.innerHTML = '';
        middle_select.innerHTML = '';
        late_select.innerHTML = '';
        threshold_input.innerHTML = '';
        

        let phageGenome;
        let gffJson;

        if(classValue === "CustomThreshold"){
            custom_div.style.display = "flex";

            const early_select = document.getElementById("early-select");
            const middle_select = document.getElementById("middle-select");
            const late_select = document.getElementById("late-select");
            const threshold_input = document.querySelector("#custom-threshold");

            if(early_select.value && middle_select.value && late_select.value && threshold_input.value){
                const assembly_etc = await get_assembly_maxEnd(genomeValue, "phage", "name");

                createGenomeViewer(`/fetch_specific_phage_genome_with_custom_threshold/${genomeValue}/${dataset}/${early_select.value}/${middle_select.value}/${late_select.value}/${threshold_input.value}`, classValue, assembly_etc);

            }else{
                const all_options = custom_div.querySelectorAll("sl-option");

                // if the selects are not yet filled with options (=> all_options is empty), we will fill them
                if(!all_options.length){
                    const timepoints = await return_timepoints(dataset); 

                    // loop through all 3 selects to fill them with timepoints as options
                    [early_select, middle_select, late_select].forEach(select => {

                        timepoints.forEach(t => {
                            if(t === "Ctrl"){
                                t = -1;
                            }
                            const option = document.createElement("sl-option");
                            option.textContent = t;
                            option.value = t; 

                            select.appendChild(option);
                        });

                    });
                }

                // add eventlisteners for each select 
                early_select.addEventListener('sl-change', async(event) =>{
                    let value = event.target.value;

                    if(value !== ""){
                        value = Number(event.target.value);
                    }

                    // fetch options of middle and late selects 
                    const middle_options = middle_select.querySelectorAll("sl-option");
                    const late_options = late_select.querySelectorAll("sl-option");
                
                    if(value !== ""){
                        middle_options.forEach(opt => {
                            const optValue = Number(opt.value);

                            if (optValue <= value){
                                opt.disabled = true;
                            }

                        });

                        late_options.forEach(opt => {
                            const optValue = Number(opt.value);

                            if (optValue <= value){
                                opt.disabled = false;
                            }

                        });

                        //  only fetch data, if all selects regarding dataset choice have a selected value and all custom threshold parameters are set
                        if(dataset && value && middle_select.value && late_select.value && threshold_input.value){
                            
                            const assembly_etc = await get_assembly_maxEnd(genomeValue, "phage", "name");

                            createGenomeViewer(`/fetch_specific_phage_genome_with_custom_threshold/${genomeValue}/${dataset}/${value}/${middle_select.value}/${late_select.value}/${threshold_input.value}`, classValue, assembly_etc);
                        }





                    }else{

                        // if no value, show all options that are disabled again by removing the disabled attribute
                        late_options.forEach(opt => {
                            const optValue = Number(opt.value);
                        
                            // if the option is disabled, handle it
                            if (opt.hasAttribute("disabled")){

                                // handle the cases in which early select still has a value selected 
                                if(middle_select.value){

                                    // only reset the disabeling for those that are bigger than the middle_select value
                                    if(optValue > middle_select.value ){
                                        opt.disabled = false;
                                    }
                                }else{
                                    // if no early boundary is selected, reset the disabeling for all options
                                    opt.disabled = false;
                                }
                                
                            }
                        });

                        middle_options.forEach(opt => {
                            const optValue = Number(opt.value);
                        
                            // if the option is disabled, handle it
                            if (opt.hasAttribute("disabled")){

                                // handle the cases in which late select still has a value selected 
                                if(late_select.value){

                                    // only reset the disabeling for those that are smaller than the late_select value
                                    if(optValue < late_select.value ){
                                        opt.disabled = false;
                                    }
                                }else{
                                    // if no late boundary is selected, reset the disabeling for all options
                                    opt.disabled = false;
                                }
                                
                            }
                        });


                        
                    }
                    
                        
                })

                middle_select.addEventListener('sl-change', async(event) =>{
                    let value = event.target.value;

                    if(value !== ""){
                        value = Number(event.target.value);
                    }

                    const late_options = document.querySelectorAll("#late-select sl-option");
                    const early_options = document.querySelectorAll("#early-select sl-option");

                    if(value !== ""){
                        
                        late_options.forEach(opt => {
                            const optValue = Number(opt.value);
                        
                            if (optValue <= value){
                                opt.disabled = true;
                            }
                        });

                        early_options.forEach(opt => {
                            const optValue = Number(opt.value);
                        
                            if (optValue >= value){
                                opt.disabled = true;
                            }
                        });
                        

                        //  only fetch data, if all selects regarding dataset choice have a selected value and all custom threshold parameters are set
                        if(dataset && early_select.value && value && late_select.value && threshold_input.value){
                            
                            const assembly_etc = await get_assembly_maxEnd(genomeValue, "phage", "name");

                            createGenomeViewer(`/fetch_specific_phage_genome_with_custom_threshold/${genomeValue}/${dataset}/${early_select.value}/${value}/${late_select.value}/${threshold_input.value}`, classValue, assembly_etc);
                        }

                    }else{
                        // if no value, show all options that are disabled again by removing the disabled attribute
                        late_options.forEach(opt => {
                            const optValue = Number(opt.value);
                        
                            // if the option is disabled, handle it
                            if (opt.hasAttribute("disabled")){

                                // handle the cases in which early select still has a value selected 
                                if(early_select.value){

                                    // only reset the disabeling for those that are bigger than the early_select value
                                    if(optValue > early_select.value ){
                                        opt.disabled = false;
                                    }
                                }else{
                                    // if no early boundary is selected, reset the disabeling for all options
                                    opt.disabled = false;
                                }
                                
                            }
                        });

                        early_options.forEach(opt => {
                            const optValue = Number(opt.value);
                        
                            // if the option is disabled, handle it
                            if (opt.hasAttribute("disabled")){

                                // handle the cases in which late select still has a value selected 
                                if(late_select.value){

                                    // only reset the disabeling for those that are smaller than the late_select value
                                    if(optValue < late_select.value ){
                                        opt.disabled = false;
                                    }
                                }else{
                                    // if no late boundary is selected, reset the disabeling for all options
                                    opt.disabled = false;
                                }
                                
                            }
                        });
                        
                    }

                    
                });


                late_select.addEventListener('sl-change', async(event) =>{
                    let value = event.target.value;

                    if(value !== ""){
                        value = Number(event.target.value);
                    }

                    const middle_options = document.querySelectorAll("#middle-select sl-option");
                    const early_options = document.querySelectorAll("#early-select sl-option");

                    if(value !== ""){
                        
                        middle_options.forEach(opt => {
                            const optValue = Number(opt.value);
                        
                            if (optValue >= value){
                                opt.disabled = true;
                            }
                        });

                        early_options.forEach(opt => {
                            const optValue = Number(opt.value);
                        
                            if (optValue >= value){
                                opt.disabled = true;
                            }
                        });
                        

                        //  only fetch data, if all selects regarding dataset choice have a selected value and all custom threshold parameters are set
                        if(dataset && early_select.value && middle_select.value && value && threshold_input.value){
                            
                            const assembly_etc = await get_assembly_maxEnd(genomeValue, "phage", "name");

                            createGenomeViewer(`/fetch_specific_phage_genome_with_custom_threshold/${genomeValue}/${dataset}/${early_select.value}/${middle_select.value}/${value}/${threshold_input.value}`, classValue, assembly_etc);
                        }

                    }else{
                        // if no value, show all options that are disabled again by removing the disabled attribute
                        middle_options.forEach(opt => {
                            const optValue = Number(opt.value);
                        
                            // if the option is disabled, handle it
                            if (opt.hasAttribute("disabled")){

                                // handle the cases in which early select still has a value selected 
                                if(early_select.value){

                                    // only reset the disabeling for those that are bigger than the early_select value
                                    if(optValue > early_select.value ){
                                        opt.disabled = false;
                                    }
                                }else{
                                    // if no early boundary is selected, reset the disabeling for all options
                                    opt.disabled = false;
                                }
                                
                            }
                        });

                        early_options.forEach(opt => {
                            const optValue = Number(opt.value);
                        
                            // if the option is disabled, handle it
                            if (opt.hasAttribute("disabled")){

                                // handle the cases in which late select still has a value selected 
                                if(middle_select.value){

                                    // only reset the disabeling for those that are smaller than the middle_select value
                                    if(optValue < middle_select.value ){
                                        opt.disabled = false;
                                    }
                                }else{
                                    // if no middle boundary is selected, reset the disabeling for all options
                                    opt.disabled = false;
                                }
                                
                            }
                        });
                        
                    }

                    
                });

                threshold_input.addEventListener('sl-input', async(event) => {
                    const value = event.target.value;

                    if(value !== ""){
                        //  only fetch data, if all selects regarding dataset choice have a selected value and all custom threshold parameters are set
                        if(dataset && early_select.value && middle_select.value && late_select.value && value){
                            
                            const assembly_etc = await get_assembly_maxEnd(genomeValue, "phage", "name");

                            createGenomeViewer(`/fetch_specific_phage_genome_with_custom_threshold/${genomeValue}/${dataset}/${early_select.value}/${middle_select.value}/${late_select.value}/${value}`, classValue, assembly_etc);
                        }

                    }
                    
                });


            }

        }else{
            custom_div.style.display = "none";
            // phageGenome = await fetch_specific_phage_genome(genomeValue, dataset);

            const assembly_etc = await get_assembly_maxEnd(genomeValue, "phage", "name");

            createGenomeViewer(`/api/fetch_specific_phage_genome/${genomeValue}/${dataset}`, classValue, assembly_etc);
        }
        
        
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

/**
 * Function that creates the genome visualization
 * @param {*} json 
 * @param {string} classValue 
 */
function createGenomeViewer(url, classValue, assembly_etc){
    // retrieve the assembly 
    const assembly = assembly_etc.assembly;
    const last_end = assembly_etc.maxLengthEntryEnd;

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
                "zoomLimits": [1000, last_end + 100],

                "data": {
                        "type": "csv",
                        "url": url,
                        "chromosomeField": "seq_id",
                        "genomicFields": ["start", "end"]
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
                            "type": "csv",
                            "url": url,
                            "chromosomeField": "seq_id",
                            "genomicFields": ["start", "end"],
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
                                "zoomLimits": [1000, last_end + 100],
                        
                            },
                            // right triangle to indicate forward strand (+)
                            {
                                "mark": "triangleRight",
                                "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene'] }, {"type": "filter", "field": "strand", "oneOf": ['+']}],
                                "x": { "field": "adjusted_end", "type": "genomic"}, 
                                "xe": { "field": "end", "type": "genomic" },
                                "zoomLimits": [1000, last_end + 100],
                            
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
                                "zoomLimits": [1000, last_end + 100],
                                
                            },
                            // left triangle to indicate reverse strand (-)
                            {"mark": "triangleLeft",
                                "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene']}, {"type": "filter", "field": "strand", "oneOf": ['-']}],
                                "x": { "field": "start", "type": "genomic"}, 
                                "xe": { "field": "adjusted_start", "type": "genomic" },
                                "zoomLimits": [1000, last_end + 100],
                                
                            },
                            {
                                "mark": "brush",
                                "x": {"linkingId": "linear-view"}, 
                                "color": {"value": "lightgray" },
                                "stroke": {"value": "gray"},
                                "strokeWidth": {"value": 1},
                                "opacity": {"value": 0.3},
                            
                            }
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
                            "type": "csv",
                            "url": url,
                            "chromosomeField": "seq_id",
                            "genomicFields": ["start", "end"],
                    
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
                                "zoomLimits": [1000, last_end + 100],
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
                                "zoomLimits": [1000, last_end + 100],
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
                                "zoomLimits": [1000, last_end + 100],
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
                                "zoomLimits": [1000, last_end + 100],
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
                        "type": "csv",
                        "url": url,
                        "chromosomeField": "seq_id",
                        "genomicFields": ["start", "end"],
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
                            "type": "csv",
                            "url": url,
                            "chromosomeField": "seq_id",
                            "genomicFields": ["start", "end"],
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
                                "zoomLimits": [1000, last_end + 100],
                        
                            },
                            // right triangle to indicate forward strand (+)
                            {
                                "mark": "triangleRight",
                                "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene'] }, {"type": "filter", "field": "strand", "oneOf": ['+']}],
                                "x": { "field": "adjusted_end", "type": "genomic"}, 
                                "xe": { "field": "end", "type": "genomic" },
                                "zoomLimits": [1000, last_end + 100],
                            
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
                                "zoomLimits": [1000, last_end + 100],
                                
                            },
                            // left triangle to indicate reverse strand (-)
                            {"mark": "triangleLeft",
                                "dataTransform": [{"type": "filter", "field": "type", "oneOf": ['gene']}, {"type": "filter", "field": "strand", "oneOf": ['-']}],
                                "x": { "field": "start", "type": "genomic"}, 
                                "xe": { "field": "adjusted_start", "type": "genomic" },
                                "zoomLimits": [1000, last_end + 100],
                                
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
                            "type": "csv",
                            "url": url,
                            "chromosomeField": "seq_id",
                            "genomicFields": ["start", "end"],
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
                                "zoomLimits": [1000, last_end + 100],
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
                                "zoomLimits": [1000, last_end + 100],
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
                                "zoomLimits": [1000, last_end + 100],
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
                                "zoomLimits": [1000, last_end + 100],
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