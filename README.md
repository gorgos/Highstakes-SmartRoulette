# RouletteContract
Smart Contract, AWS Lambda and React App for securely playing Roulette.

## The problem with randomness in smart contracts

While the problem with online gambling is the necessity of trust, that the results come from a <i>truly</i><sup>*</sup> random source, in smart contracts we can use the fact that it is 100% public to generate trusted randomness. However, we face a new challenge. Since they are 100% public, you cannot store any secrets in them and hence not have a secret seed for the RNG. Therefore the question arises, where do you get randomness from?

The obvious answer would be to use the random data from the latest or future blocks, i.e., block hash, timestamp, number, gas limit, coinbase and/or difficulty. However all of these variables can be influenced by a miner. He cannot freely choose these variables of course, but he can choose to not publish a newly found block, if its result for the randomness does not suit him. If the block reward is lower than the potential gain from the gamble, a miner will do so.

## The solution

The solution used in this project is a commitment-based approach:

1. The bank chooses a hash and submits it to the smart contract.

2. The player submits a value to the smart contract.

3. The bank submits the value fitting to the previously submitted hash.

4. Smart contract calculates a roulette number (0-36) by calculating (bank value XOR player value) % 36.

<sup>*</sup>truly in the sense of not being realistically predictable
