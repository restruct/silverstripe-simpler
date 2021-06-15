// Quite OK ref: https://docs.silverstripe.org/en/4/developer_guides/customising_the_admin_interface/reactjs_redux_and_graphql/#building-an-extensible-graphql-app
// And:
import React from 'react';
import Injector from 'lib/Injector';

const CharacterCounter = (TextField) => (props) => {
    window.simpler_dom.adminDOM_emit();
    console.log('EMITTING...');
    return (
        <div>
            <TextField {...props} />
            <div class="vue-instance"><vue-charcounter>LOADING...</vue-charcounter></div>
            <small>Character count: {props.value.length}</small>
        </div>
    );
}

// export default CharacterCounter;
Injector.transform('character-count-transform', (updater) => {
    updater.component('TextField', CharacterCounter);
});