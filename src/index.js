import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { F, Atom } from '@grammarly/focal';
import ReactJson from 'react-json-view';
import * as serviceWorker from './serviceWorker';
import _ from 'lodash';
import { AddFinancialEntryForm } from './addFinEntryForm';


const state = Atom.create({
    ui: {
        financialEntryForm: {
            show: false,
            data: {
                
            }
        }
    },
    globalParams: {
        yearOfBirth: 1980,
        planStartYear: 2019,
    },
    financialFreedom: {
        targetAge: 70,
        model: 'asdf' 
    },

    financialEntries: [
        {
            name: 'Buy a House',
            expenseLineItems: [
                {   
                    amount: 1000,
                    amountAsOfYear: 2019,
                    expenseYear: 2019,
                    inflation: 0.04,
                    recurrenceParams: {
                        recurring: true,
                        numYears: 5,
                        perpetual: false
                    },
                }
            ],
            investmentLineItems: [
                {
                    amount: 1000,
                    investmentYear: 2019,
                    expectedReturnRate: .12,
                    recurrenceParams: {
                        recurring: true,
                        numYears: 5,
                        perYearIncreaseRatio: .1,
                        maxYearsForIncrease: 3
                    },    
                },
                {
                    amount: 10,
                    investmentYear: 2005,
                    recurrenceParams: {
                        recurring: true,
                        numYears: 35,
                        perYearIncreaseRatio: .05,
                        maxYearsForIncrease: 20
                    },
                    expectedReturnRate: .08
                }
            ]
        },
    ],

});

state.subscribe((value) => {console.log('state changed', value)});

const aggregateDicts = (listOfDicts, aggregateFn) => {
    return listOfDicts.reduce(
        (prevValue, dict) => {
            _.forEach(dict, 
                      (value, key) => prevValue[[key]] = aggregateFn(_.get(prevValue, key, 0), value));
            return prevValue;
        }, 
        {});
}



const getInvestmentTimelineforItem = (investmentItem, startYear, endYear) => {
    const isRecurringInvestment = investmentItem.recurrenceParams.recurring;
    const isOneTimeInvestment = !isRecurringInvestment;

    const investmentYear = investmentItem.investmentYear;
    const numInvestmentYears = isOneTimeInvestment ? 1 : investmentItem.recurrenceParams.numYears;
    const maxYearsForIncrease = isOneTimeInvestment ? 0 : investmentItem.recurrenceParams.maxYearsForIncrease;
    const perYearIncreaseRatio = isOneTimeInvestment ? 0 : investmentItem.recurrenceParams.perYearIncreaseRatio;
    const rangeOfInvestmentYears = _.range(investmentYear, investmentYear + numInvestmentYears);
    var investmentsByYear;
    const yearRangeMap = _.range(startYear, endYear).reduce((prevValue, year) => {
        return {...prevValue, [year]: 0}
    }, {});
    
    if (_.intersection(rangeOfInvestmentYears, _.range(startYear, endYear))) {
        investmentsByYear = rangeOfInvestmentYears.reduce((prevValue, year) => {
            const numInvestmentYears = year - investmentYear;
            return {...prevValue, [year]: investmentItem.amount * Math.pow(1 + perYearIncreaseRatio, Math.min(numInvestmentYears, maxYearsForIncrease)) }
        }, {});
    } else {
        investmentsByYear = {}
    }
    console.log("asdf", investmentItem.name, investmentsByYear);
    return {...yearRangeMap, ...investmentsByYear}
}

const getNAVTimelineForItem = (investmentTimeline, expectedReturnRate) => {
    const investmentNAVTimeline = _.reduce(investmentTimeline, 
            (prevValue, value, year) => {
                const currYearNAV = value * (1 + expectedReturnRate / 2);
                const prevYearNAV = _.get(prevValue, year-1, 0) * (1 + expectedReturnRate);
                return {...prevValue, [year]: currYearNAV + prevYearNAV}
            }, 
            {});
    return investmentNAVTimeline;
}



const getAggregateInvestmentTimeline = (investments, startYear, endYear) => {
    const allInvestmentItems = _.flatMap(investments, (investment) => investment.lineItems);
    //TODO: fix calculation of NAV
    //getNAVTimelineForItem(allInvestmentItems[0], startYear, endYear)
    const allInvestmentTimelines = _.map(allInvestmentItems, (investment) => getInvestmentTimelineforItem(investment, startYear, endYear));
    const aggregateInvestmentTimeline = aggregateDicts(allInvestmentTimelines, (x, y) => x + y)
    return aggregateInvestmentTimeline
}


const inflateExpenseAmount = (lineItem, forYear) => {
    return lineItem.amount * Math.pow(1+lineItem.inflation, forYear-lineItem.amountAsOfYear)
}

const getExpenseTimeLineforItem = (lineItem, startYear, endYear) => {
    
    const isOneTimeExpense = !lineItem.recurrenceParams.recurring;
    const isPerpetualExpense = lineItem.recurrenceParams.recurring && lineItem.recurrenceParams.perpetual;
    const isRecurringExpense = lineItem.recurrenceParams.recurring && !lineItem.recurrenceParams.perpetual;
    
    const expenseYear = lineItem.expenseYear

    console.log(lineItem, startYear, endYear, isOneTimeExpense, isRecurringExpense, isPerpetualExpense, expenseYear)
    const yearRange = [...Array(endYear - startYear + 1).keys()]
    let expenseYearMap;

    const yearRangeMap = yearRange.reduce(
        (prevValue, x) => {
            const key = startYear + x;
            return {...prevValue, [key]: 0}}, 
        {});
    
    
    if (expenseYear <= endYear &&  expenseYear >= startYear) {
        if (isOneTimeExpense) {
            expenseYearMap = {[expenseYear]: inflateExpenseAmount(lineItem, expenseYear)}
        } else if (isPerpetualExpense) {
            const perpetualExpenseYearRange = _.range(expenseYear, endYear+1)
            expenseYearMap =  _.fromPairs(perpetualExpenseYearRange.map(year => [year, inflateExpenseAmount(lineItem, year)]))
        } else if (isRecurringExpense) {
            console.log("this isa recurring expense")
            // recurring but not perpetual
            const recurrenceEndYear = Math.min(endYear, (expenseYear + lineItem.recurrenceParams.numYears))
            const recurringExpenseYearRange = _.range(expenseYear, recurrenceEndYear)
            expenseYearMap =  _.fromPairs(recurringExpenseYearRange.map(year => [year, inflateExpenseAmount(lineItem, year)]))
        } else {
            expenseYearMap = {}
        }
    }
    else {
        expenseYearMap = {}
    }
    return {...yearRangeMap, ...expenseYearMap}
}

const getAggregateExpenseTimeline = (expenseGoals, startYear, endYear) => {
    const allExpenseItems = _.flatMap(expenseGoals, (expenseGoal) => expenseGoal.lineItems)
    const expenseTimelines = _.map(allExpenseItems, (expenseItem) => getExpenseTimeLineforItem(expenseItem, startYear, endYear))
    const aggregateExpenseTimeline = aggregateDicts(expenseTimelines, (x, y) => x + y)
    return aggregateExpenseTimeline;
}


const AddFinancialEntry = (props) => {
    const uiState = props.uiState;
    const financialEntries = props.financialEntries;
    const showFinancialEntryForm = (event) => {
        uiState.modify((val)=> {return {...val, show: true}})}
    const hideFinancialEntryForm = (event) => {
        uiState.modify((val)=> {return {...val, show: false}})
    } 
    const handleSaveFinancialEntry = (newData) => {
        // save the data from UI part of the tree to a financial entry
        financialEntries.modify((currValue) => {
            return [...currValue, newData]
        })
        // close and reset the form
        uiState.set({show: false, data: {}});
    }

    const finEntryFormWrapper = (
        <div key="finEntryForm"> 
            <button style={{float:"right"}} onClick={hideFinancialEntryForm}> Close </button>
            <AddFinancialEntryForm data={uiState.lens('data')} handleSaveFinancialEntry={handleSaveFinancialEntry}/>
        </div>
    );
    return (
        <F.div> 
            <button onClick={showFinancialEntryForm}> Add financial entry</button>
            {uiState.view((uiState) => uiState.show ? finEntryFormWrapper : null)}
        </F.div>)
}


const App = (props) => {
    const $state = props.state;
    
    return <F.div>
            <AddFinancialEntry uiState={$state.lens('ui').lens('financialEntryForm')} financialEntries={$state.lens('financialEntries')}/>
            {$state.view((stateValue) => {
                const planStartYear = stateValue.globalParams.planStartYear;
                const planEndYear = stateValue.globalParams.yearOfBirth + stateValue.financialFreedom.targetAge;
                const expenseGoals = stateValue.financialEntries.map((entry) => {
                    return {
                        name: entry.name,
                        lineItems: entry.expenseLineItems || []
                    }
                });
                const investments = stateValue.financialEntries.map((entry) => {
                    return {
                        name: entry.name,
                        lineItems: entry.investmentLineItems || []
                    }
                });
                const aggregateExpenseTimeline = getAggregateExpenseTimeline(expenseGoals, planStartYear, planEndYear);
                const aggregateInvestmentTimeline = getAggregateInvestmentTimeline(investments, planStartYear, planEndYear);
                return <div key="asdf">
                    <ReactJson key="expenseTimeline" src={aggregateExpenseTimeline}/>
                    <ReactJson key="investmentTimeline" src={aggregateInvestmentTimeline}/>
                </div>
            })}
        </F.div>
}


ReactDOM.render(<App state={state}/>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
