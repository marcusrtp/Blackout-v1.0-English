(function () {
  const INITIAL_SECONDS = 12 * 60;
  const FINAL_CODE = "4268891";

  const helper = (name) => (...args) => window.BlackoutPuzzleHelpers[name](...args);
  const checkbox = helper("checkbox");
  const checked = helper("checked");
  const value = helper("value");
  const selectRow = helper("selectRow");
  const availabilityRow = helper("availabilityRow");

  function shuffled(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function randomizedOptions(options) {
    const [placeholder, ...choices] = options;
    return [placeholder, ...shuffled(choices)];
  }

  function shuffledCheckboxes(choices) {
    return shuffled(choices)
      .map(([name, label]) => checkbox(name, label))
      .join("");
  }

  const easterPuzzles = {
    "egg-control": {
      order: 3,
      label: "Book",
      index: 6,
      digit: "1",
      title: "The Superpower of AI",
      question: "What is the price of this great book?",
      answerType: "price",
      answer: "18.95",
      acceptedAnswers: ["18,95", "18.95 euros", "18,95 euros", "18 euros 95", "18e95", "18?95", "1895"],
      hint: "Check its price on online platforms.",
      success: "Good catch. The <strong>price</strong> hides the <strong>third bonus fragment</strong>."
    },
    "egg-laundry": {
      order: 2,
      label: "Engie",
      index: 5,
      digit: "9",
      title: "Engie",
      question: "What is its iconic slogan?",
      answerType: "slogan",
      answer: "J'agis avec Engie",
      acceptedAnswers: ["J agis avec Engie", "J'agis Engie", "Agis avec Engie", "Agir avec Engie", "J'agis avec ENGIE"],
      hint: "It comes from an advertising campaign launched in 2018.",
      success: "Exactly. We found their <strong>iconic slogan</strong>. Here is the <strong>second bonus fragment</strong>!"
    },
    "egg-mix": {
      order: 1,
      label: "OpenAI",
      index: 4,
      digit: "8",
      title: "OpenAI",
      question: "In which year did ChatGPT become available to the general public?",
      answerType: "year",
      answer: "2022",
      acceptedAnswers: ["in 2022", "november 2022", "2022."],
      hint: "Impossible to forget: we all saw it happen.",
      success: "Correct. ChatGPT reached the general public in <strong>November 2022</strong>. Here is the <strong>first bonus fragment</strong>!"
    }
  };

  const puzzles = {
    balance: {
      index: 0,
      digit: "4",
      title: "The grid is unbalanced",
      kicker: "Puzzle 1",
      room: "control",
      startDialogue: `First diagnosis: the control screen compares <strong>production</strong> and <strong>consumption</strong>.

We must find what the <strong>grid is missing</strong>, then choose the right levers to close the gap.`,
      endDialogue: `We have balanced the first alert.

What we remember: electricity must be <strong>produced at the moment it is consumed</strong>. If demand exceeds production, the <strong>frequency drops</strong> and the grid becomes <strong>unstable</strong>.`,
      fact: "Production and consumption must remain equal at every moment. If consumption exceeds production, frequency drops.",
      hints: [
        "Compare consumption and production: a precise amount of power is missing.",
        "The grid is missing 3 GW of balance. Adding 1 GW of production or reducing demand by 1 GW closes the gap by 1 GW."
      ],
      render() {
        return `
          <p>The screen shows <strong>79 GW</strong> of production, <strong>82 GW</strong> of consumption and a frequency of <strong>74.0 Hz</strong>.</p>
          <p>There is therefore a <strong>3 GW gap</strong> to close. Each chosen action must reduce that gap.</p>
          <div class="control-grid">
            ${shuffledCheckboxes([
              ["hydro", "Use a hydro reserve: +1 GW of production"],
              ["offload", "Shift flexible uses: -1 GW of demand"],
              ["gas", "Activate a controllable power plant: +1 GW of production"],
              ["solar", "Rely on solar at night: +2 GW announced, but unavailable"]
            ])}
          </div>
        `;
      },
      validate(root) {
        return checked(root, "hydro") && checked(root, "offload") && checked(root, "gas") && !checked(root, "solar");
      },
      correction: {
        type: "checkbox",
        expected: {
          hydro: true,
          offload: true,
          gas: true,
          solar: false
        }
      }
    },
    mix: {
      index: 1,
      digit: "2",
      title: "Rebuild the French energy mix",
      kicker: "Puzzle 2",
      room: "mixroom",
      startDialogue: `In this room, we must rebuild the <strong>French electricity mix</strong>.

We rank the production sources from <strong>most used</strong> to <strong>least used</strong> to understand where the electricity on the grid comes from.`,
      endDialogue: `We have rebuilt the mix.

What we remember: the French energy mix relies mainly on <strong>nuclear</strong>, then on <strong>hydro</strong> and renewables such as <strong>wind</strong> and <strong>solar</strong>. <strong>Fossil</strong> plants mostly act as backup during tense periods.`,
      fact: "In France, nuclear power dominates electricity production. Hydro is the historic leading renewable source, followed by wind and solar. Gas and coal mostly provide backup.",
      hints: [
        "The most common source in France is not a fossil fuel.",
        "Expected order: nuclear, hydro, wind, solar, gas, coal."
      ],
      render() {
        const options = randomizedOptions(["", "Nuclear", "Hydro", "Wind", "Solar", "Gas", "Coal"]);
        return `
          <p>Rank the sources from most used to least used in French electricity production.</p>
          <div class="sort-list">
            ${selectRow(1, options)}
            ${selectRow(2, options)}
            ${selectRow(3, options)}
            ${selectRow(4, options)}
            ${selectRow(5, options)}
            ${selectRow(6, options)}
          </div>
        `;
      },
      validate(root) {
        const answer = ["Nuclear", "Hydro", "Wind", "Solar", "Gas", "Coal"];
        return answer.every((source, position) => root.querySelector(`[name="rank-${position + 1}"]`).value === source);
      },
      correction: {
        type: "select",
        expected: {
          "rank-1": "Nuclear",
          "rank-2": "Hydro",
          "rank-3": "Wind",
          "rank-4": "Solar",
          "rank-5": "Gas",
          "rank-6": "Coal"
        }
      }
    },
    weather: {
      index: 2,
      digit: "6",
      title: "Who produces when?",
      kicker: "Puzzle 3",
      room: "weatherroom",
      startDialogue: `Weather changes everything. It is <strong>night</strong>, there is <strong>little wind</strong> and demand remains <strong>high</strong>.

We must match each production source with what it can actually provide in these conditions.`,
      endDialogue: `We read the weather like grid operators.

What we remember: not all sources play the same role. Some <strong>depend on weather</strong>, others can <strong>react quickly</strong>. A stable grid needs production, but also <strong>flexibility</strong>.`,
      fact: "Production sources do not all play the same role. Solar and wind depend on weather, hydro and gas can react quickly, and nuclear provides an important base.",
      hints: [
        "Look at the context: it is night and there is little wind.",
        "Solar is weak at night, wind depends on wind, hydro is reactive, gas can cover peaks and nuclear is important and stable."
      ],
      render() {
        const options = randomizedOptions(["", "Very low", "Depends on wind", "Reactive", "Controllable for peaks", "Important and stable"]);
        const rows = shuffled([
          ["solar", "Solar"],
          ["wind", "Wind"],
          ["hydro", "Hydro"],
          ["gas", "Gas"],
          ["nuclear", "Nuclear"]
        ]);
        return `
          <p>Context: <strong>night</strong>, <strong>little wind</strong>, <strong>high demand</strong>.</p>
          <div class="sort-list">
            ${rows.map(([name, label]) => availabilityRow(name, label, options)).join("")}
          </div>
        `;
      },
      validate(root) {
        return value(root, "solar") === "Very low"
          && value(root, "wind") === "Depends on wind"
          && value(root, "hydro") === "Reactive"
          && value(root, "gas") === "Controllable for peaks"
          && value(root, "nuclear") === "Important and stable";
      },
      correction: {
        type: "select",
        expected: {
          solar: "Very low",
          wind: "Depends on wind",
          hydro: "Reactive",
          gas: "Controllable for peaks",
          nuclear: "Important and stable"
        }
      }
    },
    offpeak: {
      index: 3,
      digit: "8",
      title: "Off-peak hours",
      kicker: "Puzzle 4",
      room: "laundry",
      startDialogue: `Last lever on the consumption side: the <strong>moment when we consume</strong>.

We only schedule the <strong>devices that can wait</strong> in order to ease the peak between <strong>6 p.m.</strong> and <strong>9 p.m.</strong>.`,
      endDialogue: `We have eased the peak.

What we remember: <strong>saving</strong> matters, but <strong>shifting</strong> matters too. Moving <strong>flexible uses</strong> helps the grid get through peaks without producing more in an emergency.`,
      fact: "The grid is not only sensitive to how much is consumed. It is also sensitive to when consumption happens. Shifting flexible uses helps get through peaks.",
      hints: [
        "Look for uses that can wait without bothering the user.",
        "Shift these: electric car, washing machine, dryer, hot water tank."
      ],
      render() {
        return `
          <p>The consumption peak is expected between <strong>6 p.m.</strong> and <strong>9 p.m.</strong>. Schedule only the uses that can wait.</p>
          <div class="choice-list">
            ${shuffledCheckboxes([
              ["ev", "Electric car"],
              ["washer", "Washing machine"],
              ["dryer", "Dryer"],
              ["water", "Hot water tank"],
              ["hob", "Cooktop"],
              ["meeting", "Video-call computer"]
            ])}
          </div>
        `;
      },
      validate(root) {
        return checked(root, "ev")
          && checked(root, "washer")
          && checked(root, "dryer")
          && checked(root, "water")
          && !checked(root, "hob")
          && !checked(root, "meeting");
      },
      correction: {
        type: "checkbox",
        expected: {
          ev: true,
          washer: true,
          dryer: true,
          water: true,
          hob: false,
          meeting: false
        }
      }
    },
    final: {
      title: "Save the grid",
      kicker: "Final",
      room: "electrical",
      startDialogue: `We enter the <strong>final code</strong> on the electrical panel.

If we already know the <strong>seven digits</strong>, we can try directly and <strong>stabilize the frequency</strong>.`,
      endDialogue: `Grid stabilized.

We have understood the full logic: <strong>balance production and consumption</strong>, know the <strong>mix</strong>, take <strong>weather</strong> into account and shift <strong>flexible uses</strong>.`,
      hints: [
        "The seven digits are in the progress panel.",
        `Enter code ${FINAL_CODE} to stabilize the frequency.`
      ],
      render() {
        return `
          <p>Enter the seven digits in order to bring the grid back to <strong>95 Hz</strong>.</p>
          <input type="text" inputmode="numeric" maxlength="7" name="finalCode" aria-label="Final code" placeholder="Final code">
        `;
      },
      validate(root) {
        const input = root.querySelector('[name="finalCode"]');
        return input && input.value.trim() === FINAL_CODE;
      },
      correction: {
        type: "text",
        field: "finalCode"
      }
    }
  };

  const roomPuzzleMap = {
    control: "balance",
    mixroom: "mix",
    weatherroom: "weather",
    laundry: "offpeak",
    electrical: "final"
  };

  const victoryLessons = [
    {
      title: "Balance",
      text: "Production = consumption at every moment."
    },
    {
      title: "French mix",
      text: "Nuclear as a base, renewables as a complement."
    },
    {
      title: "Availability",
      text: "Weather and controllability change the response."
    },
    {
      title: "Off-peak hours",
      text: "Shifting uses relieves peaks."
    }
  ];

  window.BlackoutPuzzles = {
    INITIAL_SECONDS,
    FINAL_CODE,
    easterPuzzles,
    puzzles,
    roomPuzzleMap,
    victoryLessons
  };
})();
