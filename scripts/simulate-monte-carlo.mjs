/**
 * Blackjack 21 — 100,000-Hand Monte Carlo Simulation
 * 
 * Simulates 100,000+ rounds of mathematically optimal Basic Strategy vs Dealer
 * under standard 6-deck S17 DAS (Double After Split) rules.
 * 
 * Tracks:
 * - Rounds & Player Hands Played
 * - Win / Loss / Push counts and percentages
 * - Natural Blackjacks
 * - Total Wagered vs Total Returned
 * - Measured House Edge vs Theoretical Expectation (~0.5%)
 */

import { evaluateHand, isTenValue } from '../src/engine/hand.ts'
import { Shoe } from '../src/engine/cards.ts'
import { getBasicStrategyAction } from '../src/engine/ai/basic-strategy.ts'

const DEFAULT_CONFIG = {
  rounds: 100_000,
  deckCount: 6,
  dealerHitsSoft17: false, // S17
  doubleAfterSplit: true,  // DAS
  lateSurrender: false,
  resplitAces: false,
  maxSplitHands: 4,
  cutCardPenetration: 0.75,
  blackjackPayoutRatio: 1.5, // 3:2
  baseBet: 10,
}

export function runMonteCarloSimulation(config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  const tableRules = {
    deckCount: cfg.deckCount,
    blackjackPayoutRatio: cfg.blackjackPayoutRatio,
    dealerHitsSoft17: cfg.dealerHitsSoft17,
    doubleAfterSplit: cfg.doubleAfterSplit,
    lateSurrender: cfg.lateSurrender,
    resplitAces: cfg.resplitAces,
    maxSplitHands: cfg.maxSplitHands,
    doubleAllowedOn: 'any',
    cutCardPenetration: cfg.cutCardPenetration,
    trainerModeAvailable: false,
    trainerModeDefaultOpen: false,
  }

  const shoe = new Shoe(cfg.deckCount, cfg.cutCardPenetration)

  let totalRounds = 0
  let totalHands = 0
  let wins = 0
  let losses = 0
  let pushes = 0
  let naturalBlackjacks = 0
  let dealerBlackjacks = 0
  let doubleDowns = 0
  let splits = 0
  let totalWagered = 0
  let totalReturned = 0

  const startTime = performance.now()

  for (let r = 0; r < cfg.rounds; r++) {
    if (shoe.isReshuffleNeeded()) {
      shoe.reset()
    }

    totalRounds++

    // Deal initial cards
    const playerCard1 = shoe.dealCard(true)
    const dealerUpcard = shoe.dealCard(true)
    const playerCard2 = shoe.dealCard(true)
    const dealerHoleCard = shoe.dealCard(false) // hidden initially

    const dealerCards = [dealerUpcard, dealerHoleCard]
    const playerInitialCards = [playerCard1, playerCard2]

    const playerInitialVal = evaluateHand(playerInitialCards, false)
    const dealerInitialVal = evaluateHand(dealerCards, false)

    // 1. Dealer Peek Check
    const dealerShowsTenOrAce = dealerUpcard.rank === 'A' || isTenValue(dealerUpcard.rank)

    if (dealerShowsTenOrAce && dealerInitialVal.isBlackjack) {
      // Dealer has natural blackjack
      dealerBlackjacks++
      shoe.countVisibleCard(dealerHoleCard)
      totalHands++
      totalWagered += cfg.baseBet

      if (playerInitialVal.isBlackjack) {
        naturalBlackjacks++
        pushes++
        totalReturned += cfg.baseBet // Push
      } else {
        losses++
        // Loss: returned 0
      }
      continue
    }

    // 2. Player Natural Blackjack
    if (playerInitialVal.isBlackjack) {
      naturalBlackjacks++
      totalHands++
      totalWagered += cfg.baseBet
      wins++
      totalReturned += cfg.baseBet + cfg.baseBet * cfg.blackjackPayoutRatio // 3:2 payout
      shoe.countVisibleCard(dealerHoleCard)
      continue
    }

    // 3. Player Hands Execution (Handling Splits and Doubles)
    const hands = [
      {
        cards: playerInitialCards,
        bet: cfg.baseBet,
        fromSplit: false,
        isFinished: false,
        isDoubled: false,
      },
    ]

    for (let h = 0; h < hands.length; h++) {
      const hand = hands[h]

      // Loop for player decisions on this hand
      while (!hand.isFinished) {
        const handVal = evaluateHand(hand.cards, hand.fromSplit)

        if (handVal.isBust || handVal.total >= 21) {
          hand.isFinished = true
          break
        }

        const canDouble =
          hand.cards.length === 2 && (!hand.fromSplit || cfg.doubleAfterSplit)

        const isPair =
          hand.cards.length === 2 &&
          (hand.cards[0].rank === hand.cards[1].rank ||
            (isTenValue(hand.cards[0].rank) && isTenValue(hand.cards[1].rank)))

        const isAcePair =
          isPair && (hand.cards[0].rank === 'A' || hand.cards[1].rank === 'A')

        const canSplit =
          isPair &&
          hands.length < cfg.maxSplitHands &&
          (!hand.fromSplit || !isAcePair || cfg.resplitAces)

        const action = getBasicStrategyAction(hand.cards, dealerUpcard, tableRules, {
          canDouble,
          canSplit,
          canSurrender: false,
          fromSplit: hand.fromSplit,
        })

        if (action === 'stand') {
          hand.isFinished = true
          break
        } else if (action === 'hit') {
          hand.cards.push(shoe.dealCard(true))
        } else if (action === 'double') {
          doubleDowns++
          hand.bet *= 2
          hand.isDoubled = true
          hand.cards.push(shoe.dealCard(true))
          hand.isFinished = true
          break
        } else if (action === 'split') {
          splits++
          const card0 = hand.cards[0]
          const card1 = hand.cards[1]

          const newCard0 = shoe.dealCard(true)
          const newCard1 = shoe.dealCard(true)

          const splitAce = card0.rank === 'A' || card1.rank === 'A'

          // Split Aces get exactly one card and stand
          const finishImmediate = splitAce && !cfg.resplitAces

          hand.cards = [card0, newCard0]
          hand.fromSplit = true
          hand.isFinished = finishImmediate

          const newHand = {
            cards: [card1, newCard1],
            bet: hand.bet,
            fromSplit: true,
            isFinished: finishImmediate,
            isDoubled: false,
          }
          hands.push(newHand)
        }
      }
    }

    // 4. Dealer Turn
    shoe.countVisibleCard(dealerHoleCard)

    const allBusted = hands.every((h) => evaluateHand(h.cards, h.fromSplit).isBust)

    if (!allBusted) {
      let dealerVal = evaluateHand(dealerCards, false)
      while (
        dealerVal.total < 17 ||
        (cfg.dealerHitsSoft17 && dealerVal.total === 17 && dealerVal.isSoft)
      ) {
        dealerCards.push(shoe.dealCard(true))
        dealerVal = evaluateHand(dealerCards, false)
      }
    }

    const finalDealerVal = evaluateHand(dealerCards, false)

    // 5. Payout Settlement for each hand
    for (const hand of hands) {
      totalHands++
      totalWagered += hand.bet
      const pVal = evaluateHand(hand.cards, hand.fromSplit)

      if (pVal.isBust) {
        losses++
        // Total returned = 0
      } else if (finalDealerVal.isBust) {
        wins++
        totalReturned += hand.bet * 2
      } else if (pVal.total > finalDealerVal.total) {
        wins++
        totalReturned += hand.bet * 2
      } else if (pVal.total < finalDealerVal.total) {
        losses++
        // Total returned = 0
      } else {
        pushes++
        totalReturned += hand.bet
      }
    }
  }

  const elapsedSeconds = (performance.now() - startTime) / 1000
  const netProfit = totalReturned - totalWagered
  const houseEdgePercent = (-netProfit / totalWagered) * 100
  const winRatePercent = (wins / totalHands) * 100
  const lossRatePercent = (losses / totalHands) * 100
  const pushRatePercent = (pushes / totalHands) * 100

  return {
    totalRounds,
    totalHands,
    wins,
    losses,
    pushes,
    naturalBlackjacks,
    dealerBlackjacks,
    doubleDowns,
    splits,
    totalWagered,
    totalReturned,
    netProfit,
    houseEdgePercent,
    winRatePercent,
    lossRatePercent,
    pushRatePercent,
    elapsedSeconds,
  }
}

async function main() {
  console.log('===================================================================')
  console.log('  Blackjack 21 — 100,000-Hand Monte Carlo Simulation')
  console.log('  Rules: 6 Decks | S17 (Dealer Stands Soft 17) | DAS | 3:2 BJ')
  console.log('===================================================================\n')

  const results = runMonteCarloSimulation({ rounds: 100_000 })

  console.log(`Simulation completed in ${results.elapsedSeconds.toFixed(2)}s`)
  console.log('-------------------------------------------------------------------')
  console.log(`Rounds Simulated:        ${results.totalRounds.toLocaleString()}`)
  console.log(`Total Hands Evaluated:   ${results.totalHands.toLocaleString()}`)
  console.log(`Natural Blackjacks:      ${results.naturalBlackjacks.toLocaleString()} (${((results.naturalBlackjacks / results.totalHands) * 100).toFixed(2)}%)`)
  console.log(`Dealer Blackjacks:       ${results.dealerBlackjacks.toLocaleString()} (${((results.dealerBlackjacks / results.totalRounds) * 100).toFixed(2)}%)`)
  console.log(`Double Downs:            ${results.doubleDowns.toLocaleString()}`)
  console.log(`Splits:                  ${results.splits.toLocaleString()}`)
  console.log('-------------------------------------------------------------------')
  console.log(`Hands Won:               ${results.wins.toLocaleString().padStart(8)}  (${results.winRatePercent.toFixed(2)}%)`)
  console.log(`Hands Lost:              ${results.losses.toLocaleString().padStart(8)}  (${results.lossRatePercent.toFixed(2)}%)`)
  console.log(`Hands Pushed:            ${results.pushes.toLocaleString().padStart(8)}  (${results.pushRatePercent.toFixed(2)}%)`)
  console.log('-------------------------------------------------------------------')
  console.log(`Total Amount Wagered:    $${results.totalWagered.toLocaleString()}`)
  console.log(`Total Amount Returned:   $${results.totalReturned.toLocaleString()}`)
  console.log(`Net Player Outcome:      $${results.netProfit.toLocaleString()}`)
  console.log('===================================================================')
  console.log(`  MEASURED HOUSE EDGE:   ${results.houseEdgePercent.toFixed(3)}%`)
  console.log(`  THEORETICAL BENCHMARK: ~0.50% (Standard 6-deck S17 DAS)`)
  console.log('===================================================================\n')

  // Mathematical convergence check:
  // With 100,000 hands, standard deviation of mean is ~0.36%, so 95% confidence interval is ~0.50% ± 0.71% [-0.21%, 1.21%]
  if (results.houseEdgePercent >= -0.3 && results.houseEdgePercent <= 1.3) {
    console.log('✓ CONVERGENCE VERIFIED: House edge closely matches theoretical expectation (~0.5%).')
  } else {
    console.warn(`Note: House edge ${results.houseEdgePercent.toFixed(3)}% is outside 95% CI [-0.3%, 1.3%].`)
  }
}

const isDirectRun =
  process.argv[1] &&
  (import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1].endsWith('simulate-monte-carlo.mjs'))

if (isDirectRun) {
  main().catch((err) => {
    console.error('Simulation error:', err)
    process.exit(1)
  })
}

