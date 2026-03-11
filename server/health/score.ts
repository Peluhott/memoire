// functions that i'll use to calculate increment/decrement value to add to score
//recieve data set every 3 days for hrv values


// one controller function will check if data exists for each type, if it
// does it will call the function for each type , sum up values and adjust



// I'll allow each function to give a return value of -2 to +2
// return value will be calculated based on how far 3 day average deviates from baseline

// 25% difference =  2
//15% - 25% difference = 1
// 7.5%-15% = .5
// 0 - 7.5% = 0

//then i will take them sum of these and take the Math.max of (sum, 2) if greater than 0, Math.min(-2, sum) if less than


//function for hrv - assign higher weight for this since its best predictor











//2function for sleep analysis




//3function for resting heart rate

//function for steps