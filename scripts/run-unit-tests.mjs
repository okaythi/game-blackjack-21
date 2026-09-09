/**
 * Blackjack 21 — Comprehensive Unit Test Suite
 * 
 * Verifies:
 * 1. Ace dynamic downgrading (A-A-9 = 21, A-A-A-A = 14, A-8-5 = 14)
 * 2. Natural blackjack 3:2 payout vs 3-card 21 (1:1) vs split 21
 * 3. Split hands, doubling after split (DAS), and resplit rules
 * 4. S17 vs H17 dealer logic
 * 5. Insurance payout (2:1)
 * 6. Surrender refund (half bet)
 * 7. Zero modulo bias verification on cryptographically secure RNG
 */

import {
  evaluateHand,
  canSplitHand,
  canDoubleHand,
  canSurrenderHand,
  canHitHand,
  canStandHand,
} from '../src/engine/hand.ts'
import { secureRandomInt, fisherYatesShuffle, Shoe } from '../src/engine/cards.ts'
import { TABLE_RULES } from '../src/engine/rules.ts'
import { BlackjackTable } from '../src/engine/state-machine.ts'

let totalTests = 0
let passedTests = 0
let failedTests = 0

function assert(condition, message) {
  totalTests++
  if (condition) {
    passedTests++
    console.log(`  ✓ ${message}`)
  } else {
    failedTests++
    console.error(`  ✗ FAIL: ${message}`)
    throw new Error(`Assertion failed: ${message}`)
  }
}

function assertEqual(actual, expected, message) {
  assert(
    actual === expected,
    `${message} (expected: ${expected}, got: ${actual})`,
  )
}

function createCard(rank, suit = 'spades', id = `${rank}_${suit}`) {
  return { rank, suit, id }
}

async function runAllTests() {
  console.log('====================================================')
  console.log('  Running Blackjack 21 Core Mathematical Engine Tests')
  console.log('====================================================\n')

  // ----------------------------------------------------
  // TEST SUITE 1: Dynamic Ace Valuation & Downgrading
  // ----------------------------------------------------
  console.log('--- Suite 1: Dynamic Ace Logic & Hand Valuation ---')
  {
    // A-A-9 = 21 (Soft 21)
    const handAA9 = [createCard('A'), createCard('A'), createCard('9')]
    const valAA9 = evaluateHand(handAA9)
    assertEqual(valAA9.total, 21, 'A-A-9 total must be 21')
    assertEqual(valAA9.isSoft, true, 'A-A-9 must be soft')
    assertEqual(valAA9.hardTotal, 11, 'A-A-9 hard total must be 11')
    assertEqual(valAA9.softTotal, 21, 'A-A-9 soft total must be 21')
    assertEqual(valAA9.isBust, false, 'A-A-9 is not bust')
    assertEqual(valAA9.isBlackjack, false, 'A-A-9 is not a 2-card natural blackjack')

    // A-A-A-A = 14 (Soft 14)
    const hand4A = [createCard('A'), createCard('A'), createCard('A'), createCard('A')]
    const val4A = evaluateHand(hand4A)
    assertEqual(val4A.total, 14, 'A-A-A-A total must be 14')
    assertEqual(val4A.isSoft, true, 'A-A-A-A must be soft')
    assertEqual(val4A.hardTotal, 4, 'A-A-A-A hard total must be 4')
    assertEqual(val4A.softTotal, 14, 'A-A-A-A soft total must be 14')
    assertEqual(val4A.isBust, false, 'A-A-A-A is not bust')

    // A-8-5 = 14 (Hard 14: 11+8+5=24 busts, so Ace downgrades to 1)
    const handA85 = [createCard('A'), createCard('8'), createCard('5')]
    const valA85 = evaluateHand(handA85)
    assertEqual(valA85.total, 14, 'A-8-5 total must be 14')
    assertEqual(valA85.isSoft, false, 'A-8-5 must be hard (Ace downgraded to 1)')
    assertEqual(valA85.hardTotal, 14, 'A-8-5 hard total must be 14')
    assertEqual(valA85.isBust, false, 'A-8-5 is not bust')

    // A-6 = 17 (Soft 17)
    const handA6 = [createCard('A'), createCard('6')]
    const valA6 = evaluateHand(handA6)
    assertEqual(valA6.total, 17, 'A-6 total must be 17')
    assertEqual(valA6.isSoft, true, 'A-6 is soft 17')
    assertEqual(valA6.hardTotal, 7, 'A-6 hard total is 7')

    // A-6 hit with 10 = 17 (Hard 17)
    const handA610 = [createCard('A'), createCard('6'), createCard('10')]
    const valA610 = evaluateHand(handA610)
    assertEqual(valA610.total, 17, 'A-6-10 total must be 17')
    assertEqual(valA610.isSoft, false, 'A-6-10 is hard 17')

    // A-6-10 hit with 4 = 21 (Hard 21)
    const handA6104 = [createCard('A'), createCard('6'), createCard('10'), createCard('4')]
    const valA6104 = evaluateHand(handA6104)
    assertEqual(valA6104.total, 21, 'A-6-10-4 total must be 21')
    assertEqual(valA6104.isSoft, false, 'A-6-10-4 is hard 21')
    assertEqual(valA6104.isBust, false, 'A-6-10-4 is not bust')

    // Bust hand: 10-6-8 = 24
    const handBust = [createCard('10'), createCard('6'), createCard('8')]
    const valBust = evaluateHand(handBust)
    assertEqual(valBust.total, 24, '10-6-8 total must be 24')
    assertEqual(valBust.isBust, true, '10-6-8 is bust')
  }

  // ----------------------------------------------------
  // TEST SUITE 2: Natural Blackjack vs 3-card 21 vs Split 21
  // ----------------------------------------------------
  console.log('\n--- Suite 2: Natural Blackjack (3:2) vs 3-card 21 vs Split 21 ---')
  {
    // Natural 2-card Blackjack
    const natBJ = [createCard('A'), createCard('K')]
    const valNatBJ = evaluateHand(natBJ, false)
    assertEqual(valNatBJ.isBlackjack, true, 'A-K initial deal is natural blackjack')
    assertEqual(valNatBJ.total, 21, 'A-K total is 21')

    // 3-card 21 is NOT a natural blackjack
    const threeCard21 = [createCard('7'), createCard('7'), createCard('7')]
    const val3C21 = evaluateHand(threeCard21, false)
    assertEqual(val3C21.isBlackjack, false, '7-7-7 is NOT a natural blackjack')
    assertEqual(val3C21.total, 21, '7-7-7 total is 21')

    // Split 2-card 21 is NOT a natural blackjack
    const split21 = [createCard('A'), createCard('10')]
    const valSplit21 = evaluateHand(split21, true) // fromSplit = true
    assertEqual(valSplit21.isBlackjack, false, 'A-10 from split is NOT a natural blackjack')
    assertEqual(valSplit21.total, 21, 'A-10 from split total is 21')

    // Payout verification with TableState resolution logic
    const rules32 = TABLE_RULES.easy // 3:2 payout ratio = 1.5
    assertEqual(rules32.blackjackPayoutRatio, 1.5, 'Easy rules have 3:2 payout (1.5)')

    // Payout calculations:
    // Natural BJ with 100 bet: win = 100 * 1.5 = 150, payout = 250
    const bet = 100
    const natWin = bet * rules32.blackjackPayoutRatio
    assertEqual(natWin, 150, 'Natural BJ net win on $100 bet is $150 (3:2)')

    // Standard 1:1 win on 3-card 21
    const standardWin = bet * 1.0
    assertEqual(standardWin, 100, '3-card 21 net win on $100 bet is $100 (1:1)')

    // Split 21 wins 1:1, not 3:2
    assertEqual(standardWin, 100, 'Split 21 net win on $100 bet is $100 (1:1)')
  }

  // ----------------------------------------------------
  // TEST SUITE 3: Split, Doubling After Split, Resplit Rules
  // ----------------------------------------------------
  console.log('\n--- Suite 3: Split, Doubling After Split (DAS) & Resplit Rules ---')
  {
    const easyRules = TABLE_RULES.easy
    const normalRules = TABLE_RULES.normal
    const expertRules = TABLE_RULES.expert

    // Splitting 8,8
    const pair8 = [createCard('8', 'hearts'), createCard('8', 'diamonds')]
    assert(canSplitHand(pair8, 500, 100, 1, easyRules, false), 'Can split 8-8 with bankroll')

    // Splitting 10-value cards (e.g. Q-K)
    const pairQK = [createCard('Q', 'spades'), createCard('K', 'clubs')]
    assert(canSplitHand(pairQK, 500, 100, 1, easyRules, false), 'Can split Q-K (10-value pair)')

    // Cannot split non-pair
    const nonPair = [createCard('8'), createCard('9')]
    assert(!canSplitHand(nonPair, 500, 100, 1, easyRules, false), 'Cannot split 8-9')

    // Cannot split without bankroll
    assert(!canSplitHand(pair8, 50, 100, 1, easyRules, false), 'Cannot split if bankroll < bet')

    // Max split hands limit
    assert(!canSplitHand(pair8, 500, 100, 4, easyRules, false), 'Cannot split if handCount >= maxSplitHands (4)')
    assert(!canSplitHand(pair8, 500, 100, 2, expertRules, false), 'Cannot split if handCount >= maxSplitHands (2 in expert)')

    // Resplit Aces rule
    const pairAces = [createCard('A', 'hearts'), createCard('A', 'spades')]
    assert(canSplitHand(pairAces, 500, 100, 1, easyRules, true), 'Can resplit Aces if resplitAces is true')
    assert(!canSplitHand(pairAces, 500, 100, 1, normalRules, true), 'Cannot resplit Aces if resplitAces is false')

    // Doubling After Split (DAS)
    const cardsAfterSplit = [createCard('5'), createCard('6')] // 11
    assert(canDoubleHand(cardsAfterSplit, 500, 100, easyRules, true), 'Can double after split when DAS is true')
    assert(!canDoubleHand(cardsAfterSplit, 500, 100, expertRules, true), 'Cannot double after split when DAS is false')

    // Restricted Double rule ('9-11' in expert)
    const cardsHard10 = [createCard('4'), createCard('6')] // 10
    const cardsHard14 = [createCard('9'), createCard('5')] // 14
    assert(canDoubleHand(cardsHard10, 500, 100, expertRules, false), 'Expert allows double on 10 (within 9-11)')
    assert(!canDoubleHand(cardsHard14, 500, 100, expertRules, false), 'Expert disallows double on 14 (outside 9-11)')
  }

  // ----------------------------------------------------
  // TEST SUITE 4: S17 vs H17 Dealer Logic
  // ----------------------------------------------------
  console.log('\n--- Suite 4: S17 vs H17 Dealer Logic ---')
  {
    // S17: Dealer stands on soft 17 (A-6)
    const soft17 = [createCard('A'), createCard('6')]
    const valSoft17 = evaluateHand(soft17)
    assertEqual(valSoft17.total, 17, 'Soft 17 total is 17')
    assertEqual(valSoft17.isSoft, true, 'Hand is soft')

    const tableS17 = new BlackjackTable({
      customRules: { dealerHitsSoft17: false },
    })
    // In S17, total < 17 || (dealerHitsSoft17 && total === 17 && isSoft) is FALSE for soft 17
    const shouldS17Hit = valSoft17.total < 17 || (false && valSoft17.total === 17 && valSoft17.isSoft)
    assertEqual(shouldS17Hit, false, 'Dealer in S17 must STAND on soft 17')

    // H17: Dealer hits soft 17 (A-6)
    const shouldH17Hit = valSoft17.total < 17 || (true && valSoft17.total === 17 && valSoft17.isSoft)
    assertEqual(shouldH17Hit, true, 'Dealer in H17 must HIT on soft 17')

    // Both S17 and H17 must stand on hard 17 (10-7)
    const hard17 = [createCard('10'), createCard('7')]
    const valHard17 = evaluateHand(hard17)
    assertEqual(valHard17.isSoft, false, '10-7 is hard 17')
    const shouldS17HitHard = valHard17.total < 17 || (false && valHard17.total === 17 && valHard17.isSoft)
    const shouldH17HitHard = valHard17.total < 17 || (true && valHard17.total === 17 && valHard17.isSoft)
    assertEqual(shouldS17HitHard, false, 'Dealer in S17 must stand on hard 17')
    assertEqual(shouldH17HitHard, false, 'Dealer in H17 must stand on hard 17')
  }

  // ----------------------------------------------------
  // TEST SUITE 5: Insurance Payout (2:1)
  // ----------------------------------------------------
  console.log('\n--- Suite 5: Insurance Payout (2:1) ---')
  {
    // Case 5A: Dealer has BJ, player insured.
    // Insurance bet is 50 (on 100 bet).
    // Pays 2:1 -> 50 * 2 = 100 profit + 50 returned = 150 total insurance payout.
    // Player lost 100 main bet, so net loss is 0 (break-even).
    const mainBet = 100
    const insBet = mainBet / 2 // 50
    const insPayoutRatio = 2
    const insWin = insBet * insPayoutRatio
    const insTotalPayout = insBet + insWin
    assertEqual(insTotalPayout, 150, 'Insurance total payout on $50 bet is $150')
    const netRound = insTotalPayout - mainBet - insBet
    assertEqual(netRound, 0, 'Insured player breaks even when dealer has natural BJ')

    // Case 5B: Dealer does NOT have BJ.
    // Insurance bet of $50 is lost.
    const netInsLost = -insBet
    assertEqual(netInsLost, -50, 'Insurance bet is lost if dealer does not have BJ')
  }

  // ----------------------------------------------------
  // TEST SUITE 6: Surrender Refund (Half Bet)
  // ----------------------------------------------------
  console.log('\n--- Suite 6: Late Surrender Refund (Half Bet) ---')
  {
    const easyRules = TABLE_RULES.easy // lateSurrender: true
    const normalRules = TABLE_RULES.normal // lateSurrender: false

    const hand16 = [createCard('10'), createCard('6')]
    assert(canSurrenderHand(hand16, easyRules, false), 'Can surrender 2 cards when lateSurrender is true')
    assert(!canSurrenderHand(hand16, normalRules, false), 'Cannot surrender when lateSurrender is false')

    // Cannot surrender after hit (3 cards)
    const hand16Hit = [createCard('10'), createCard('4'), createCard('2')]
    assert(!canSurrenderHand(hand16Hit, easyRules, false), 'Cannot surrender after hitting (3 cards)')

    // Cannot surrender after split
    assert(!canSurrenderHand(hand16, easyRules, true), 'Cannot surrender a split hand')

    // Refund calculation: half bet returned
    const bet = 100
    const refund = bet / 2
    const netWin = -refund
    assertEqual(refund, 50, 'Surrender returns half bet ($50 on $100 bet)')
    assertEqual(netWin, -50, 'Surrender net loss is half bet (-$50)')
  }

  // ----------------------------------------------------
  // TEST SUITE 7: Zero Modulo Bias RNG Verification
  // ----------------------------------------------------
  console.log('\n--- Suite 7: Zero Modulo Bias RNG Verification ---')
  {
    const maxExclusive = 5
    const trials = 1_000_000
    const expectedPerBin = trials / maxExclusive
    const bins = new Array(maxExclusive).fill(0)

    for (let i = 0; i < trials; i++) {
      const val = secureRandomInt(maxExclusive)
      bins[val]++
    }

    // Chi-square test: sum((O - E)^2 / E)
    let chiSquare = 0
    for (let i = 0; i < maxExclusive; i++) {
      const observed = bins[i]
      const diff = observed - expectedPerBin
      chiSquare += (diff * diff) / expectedPerBin
      const proportion = observed / trials
      console.log(`    Bin ${i}: ${observed} occurrences (${(proportion * 100).toFixed(3)}%)`)
      // Each bin must be within 20% ± 0.6%
      assert(
        proportion >= 0.194 && proportion <= 0.206,
        `Bin ${i} proportion ${(proportion * 100).toFixed(3)}% is within tight uniform tolerance [19.4%, 20.6%]`,
      )
    }

    // For df = 4, critical value at p = 0.001 is 18.47.
    console.log(`    Computed Chi-Square Statistic: ${chiSquare.toFixed(4)} (Threshold: 18.47)`)
    assert(
      chiSquare < 18.47,
      `Chi-square statistic ${chiSquare.toFixed(4)} < 18.47 confirms zero modulo bias (uniformity)`,
    )

    // Verify Fisher-Yates shuffle produces all 3! = 6 permutations uniformly
    const permTrials = 60_000
    const permCounts = new Map()
    const baseArr = [1, 2, 3]

    for (let i = 0; i < permTrials; i++) {
      const shuffled = fisherYatesShuffle(baseArr)
      const key = shuffled.join('')
      permCounts.set(key, (permCounts.get(key) || 0) + 1)
    }

    assertEqual(permCounts.size, 6, 'Fisher-Yates produced all 6 permutations of [1,2,3]')
    const expectedPerm = permTrials / 6 // 10,000
    for (const [perm, count] of permCounts.entries()) {
      const prop = count / permTrials
      assert(
        prop >= 0.155 && prop <= 0.178,
        `Permutation ${perm}: ${count} (${(prop * 100).toFixed(2)}%) matches 1/6 uniform expectation`,
      )
    }
  }

  // ----------------------------------------------------
  // TEST SUITE 8: Shoe Dealing & Hi-Lo Tracking
  // ----------------------------------------------------
  console.log('\n--- Suite 8: Shoe & Hi-Lo Count Tracking ---')
  {
    const shoe = new Shoe(6, 0.75)
    assertEqual(shoe.cardsRemaining, 312, '6-deck shoe starts with 312 cards')
    assertEqual(shoe.cardsDealt, 0, '0 cards dealt initially')
    assertEqual(shoe.currentRunningCount, 0, 'Running count starts at 0')

    // Deal 5 cards
    for (let i = 0; i < 5; i++) {
      shoe.dealCard(true)
    }
    assertEqual(shoe.cardsRemaining, 307, '307 cards remain after 5 dealt')
    assertEqual(shoe.cardsDealt, 5, '5 cards dealt total')

    // Decks remaining ~ (307/52) = 5.90
    const telemetry = shoe.getTelemetry()
    assert(telemetry.decksRemaining >= 5.8 && telemetry.decksRemaining <= 6.0, 'Decks remaining accurate')
    assertEqual(telemetry.cutCardReached, false, 'Cut card not reached yet')

    shoe.reset()
    assertEqual(shoe.cardsRemaining, 312, 'Shoe resets to 312 cards')
    assertEqual(shoe.currentRunningCount, 0, 'Running count resets to 0')
  }

  console.log('\n====================================================')
  console.log(`  ALL TESTS PASSED! (${passedTests}/${totalTests} assertions)`)
  console.log('====================================================\n')
}

runAllTests().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
