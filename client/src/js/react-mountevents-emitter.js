// Quite OK ref: https://docs.silverstripe.org/en/4/developer_guides/customising_the_admin_interface/reactjs_redux_and_graphql/#building-an-extensible-graphql-app
// And: https://docs.silverstripe.org/en/4/developer_guides/customising_the_admin_interface/reactjs_redux_and_graphql/#notes-app
// And: https://reactjs.org/docs/state-and-lifecycle.html
import React from 'react';
import ReactDOM from 'react-dom';
import Injector from 'lib/Injector';

// react 'component' as function
// const FormWrapper = (Form) => (props) => {
//     window.simpler_dom.adminDOM_emit();
//     console.log('FORM EMITTING...');
//     return (
//         <Form {...props} />
//     );
// }

// react 'component' as class
const FormWrapper = (Form) => (
    // https://github.com/silverstripe/silverstripe-admin/blob/1/client/src/components/Form/Form.js
    class FormWrapperItem extends React.Component {
        componentDidMount() {
            this.browserDomEl = ReactDOM.findDOMNode(this);
            // console.log('FORM MOUNT - EMITTING...', this.browserDomEl, Date.now());
            window.simpler_dom.emitInsert('mount', this.browserDomEl, 0);
        }

        componentWillUnmount() {
            // console.log('FORM UNMOUNT - EMITTING...', this.browserDomEl, Date.now());
            window.simpler_dom.emitRemove('unmount', this.browserDomEl, 0);
        }

        render() {
            return (
                <Form {...this.props} />
            );
        }
    }
);

// Register this 'transformation' on the original Silverstripe Form 'component'
Injector.transform('simpler-form-mount-emitter', (updater) => {
    updater.component('Form', FormWrapper);
});