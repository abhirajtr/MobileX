var uniqueOccurrences = function(arr) {
    const set = new Set(arr);
    console.log(set);
    console.log(arr.length,set.size);
    
    return set.size < arr.length? true : false;
};

console.log(uniqueOccurrences([3,5,-2,-3,-6,-6]));