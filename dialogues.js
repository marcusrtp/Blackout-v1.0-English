(function () {
  const introDialogue = `<strong>General alert.</strong> A consumption spike is hitting the city during a heatwave. We take over as Engie technicians, trapped in the control room: the door is connected to the electrical panel.

We have <strong>12 minutes</strong> to <strong>unlock the final door</strong>!

No expert knowledge needed: each room teaches us one simple idea. We observe, use hints if needed, collect the <strong>code fragments</strong> and bring the frequency back to <strong>95 Hz</strong>.

<strong>Warning:</strong> <strong>3 easter eggs</strong> are also hidden in the rooms.`;

  const roomGuides = {
    control: "Control room: we compare the two numbers. If power is missing, we must add production or reduce demand.",
    mixroom: "Energy mix office: we think about the major production families. In France, nuclear power ranks very high.",
    weatherroom: "Weather station: we check the context before choosing. At night, solar produces very little; with little wind, wind power is limited.",
    laundry: "Technical room: here, we understand that the question is not only how much we consume, but when we consume it.",
    electrical: "Final panel: we enter the fragments in order. In jury mode, we can also use the final code directly to show the ending."
  };

  const juryMessages = {
    control: "Jury message: we discover that electricity is very difficult to store at large scale. The grid must balance production and consumption at every moment.",
    mixroom: "Jury message: we rebuild the French energy mix, mostly nuclear, then hydro, wind, solar and fossil backup sources.",
    weatherroom: "Jury message: we see that all energy sources are not available at the same time. Weather and controllability change the grid strategy.",
    laundry: "Jury message: we show that shifting flexible uses away from peaks can help the grid as much as reducing consumption.",
    electrical: "Jury message: the victory brings everything together. We stabilize the grid with the right balance, the right mix and the right consumption timing."
  };

  window.BlackoutDialogues = {
    introDialogue,
    roomGuides,
    juryMessages
  };
})();
