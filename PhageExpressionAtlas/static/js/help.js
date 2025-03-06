/**
 * Function to initialize the Help page 
 */
export function initializeHelpPage(){
    console.log("Help loaded")



    const left_slider = document.getElementById('left-slider');
    const right_slider = document.getElementById('right-slider');

    const min_input_field = document.getElementById('min-input-field');
    const max_input_field = document.getElementById('max-input-field');

    updateRangeFill(left_slider, right_slider)

    left_slider.addEventListener('input',(event) =>{
        let value = event.target.value;
        if (value > parseInt(right_slider.value)){
            value = right_slider.value;
            left_slider.value= value;
        }

        
        updateRangeFill(left_slider, right_slider);
        min_input_field.value = value;
        
    })

    right_slider.addEventListener('input',(event) =>{
        let value = event.target.value;

        if(value < parseInt(left_slider.value)){
            value = left_slider.value;
            right_slider.value = value;
        }
        updateRangeFill(left_slider, right_slider);
        max_input_field.value = value;
    })

    min_input_field.addEventListener('input',(event) => {
        let value = event.target.value;
        if (value >= parseInt(max_input_field.value)){
            min_input_field.max = max_input_field.value
        }
        left_slider.value = value;
        updateRangeFill(left_slider, right_slider);
    });

    max_input_field.addEventListener('input',(event) => {
        let value = event.target.value;
        if (value <= parseInt(min_input_field.value)){
            max_input_field.min = min_input_field.value
        }
        right_slider.value = value;
        updateRangeFill(left_slider, right_slider);
    });




}


function updateRangeFill(left_slider, right_slider){
    const min = parseInt(left_slider.value);
    const max = parseInt(right_slider.value);

    const range = right_slider.max - right_slider.min;

    right_slider.style.background = `linear-gradient(
        to right,
        var(--slider-gray) 0%,
        var(--slider-gray) ${(min / range) * 100}%,
        var(--col5) ${(min / range) * 100}%,
        var(--col5) ${(max / range) * 100}%,
        var(--slider-gray) ${(max / range) * 100}%,
        var(--slider-gray) 100%
      )`;
}