import React from 'react';
import { Formik, Field, ErrorMessage } from 'formik';
import { F } from '@grammarly/focal';
import _ from 'lodash';


const ExpenseLineItem = (props) => {

    const handleLineItemChange = (lineItemValues) => {
        // cleanup lineItemValues
        const amount = parseInt(lineItemValues.amount);
        const amountAsOfYear = parseInt(lineItemValues.amountAsOfYear);
        const expenseYear = parseInt(lineItemValues.expenseYear);
        const inflation = parseFloat(lineItemValues.inflation);
        const recurrenceParams = {
            recurring: false,
            numYears: 0,
            perpetual: false
        }
        props.handleLineItemChange(props.id, {
            amount, amountAsOfYear, expenseYear, inflation, recurrenceParams
        });
    }

    return (
        <Formik initialValues={props.defaultValues}
            onSubmit={(values, actions) => {
                handleLineItemChange(values)
            }}
            render={(props) => {
                return (
                    <div>
                        <div>
                            <label>
                                <span>Amount</span>
                                <Field type="text" name="amount" value={props.values.amount} onBlur={(e) => handleLineItemChange(props.values)} required/>
                            </label>
                            <label>
                                <span>&nbsp;&nbsp;as of year</span>
                                <Field type="text" name="amountAsOfYear" value={props.values.amountAsOfYear} onBlur={(e) => handleLineItemChange(props.values)} required/>
                            </label>
                            <label>
                                <span>. &nbsp;&nbsp;Year of expense</span>
                                <Field type="text" name="expenseYear" value={props.values.expenseYear} onBlur={(e) => handleLineItemChange(props.values)} required/>
                            </label>
                            <label>
                                <span>&nbsp;&nbsp;with inflation</span>
                                <Field type="text" name="inflation" value={props.values.inflation} onBlur={(e) => handleLineItemChange(props.values)} required/>
                            </label>
                        </div>
                    </div>
                )
            }} />
    )
}

export const AddFinancialEntryForm = (props) => {
    const $finEntry = props.data;
    const $finEntryName = $finEntry.lens('name');
    const $expenseLineItems = $finEntry.lens('expenseLineItems');
    const defaultExpenseLineItemData = {
        amount: 0,
        amountAsOfYear: (new Date()).getFullYear(),
        expenseYear: (new Date()).getFullYear(),
        inflation: 0.04,
        recurrenceParams: {
            recurring: false,
            numYears: 0,
            perpetual: false
        },
    }
    
    const handleNameChange = (event) => {
        $finEntryName.set(event.target.value);
    }

    const handleLineItemChange = (id, values) => {
        console.log("ExpenseLineItems", $expenseLineItems.get());
        $expenseLineItems.modify((data) => {
            return data === undefined ? [values] : [...data.slice(0, id), values, ...data.slice(id+1)]
            });
    }

    const handleSaveFinancialEntry = (event) => {
        props.handleSaveFinancialEntry($finEntry.get());
    }

    const handleAddExpense = (e) => {
        $expenseLineItems.modify((data) => {
            const defaultData = defaultExpenseLineItemData; 
            return data === undefined ? [defaultData] : [...data, defaultData]
            });
    }
    
    const existingExpenseEntries = $expenseLineItems.view((lineItems) => _.map(lineItems, (value, i) => {
        return <div key={i}> 
            <ExpenseLineItem 
                    id={i}
                    handleLineItemChange={handleLineItemChange}
                    defaultValues={value}
                /> 
        </div>
    }));
    

    return (
        <div>
            <h1> Add Financial Entries </h1>
            <div>
                <label for="name">
                    Name
                    <F.input name="name" type="text" required onBlur={handleNameChange} />
                </label>
                <div>
                    <F.div> {existingExpenseEntries} </F.div>
                    <button onClick={handleAddExpense}> Add Expense</button>
                </div>
            </div>
            
            <p> =============== </p>
            <button onClick={handleSaveFinancialEntry}> Save Financial Entry </button>
        </div>
    )
}