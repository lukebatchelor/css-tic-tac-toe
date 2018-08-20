# CSS Tic Tac Toe

A game of Tic Tac Toe created using only CSS and HTML, no JavaScript™!

Play against a [computer](https://css-ttt.netlify.com/), or against [a friend](https://css-ttt.netlify.com/2)!

![](https://i.imgur.com/42H8H4V.gif)

# Why?

Well, this started as a [proof of concept](https://codepen.io/hotmilo23/full/mqeVpo/), I knew I could represent state machines and move between states using HTML and a tiny bit of CSS, but I did't know if it would be possible to store all the states on one page and have the game actually work.

It turns out with some creative optimizations, you can represent every game of tic-tac-toe with only **5477** states and your browser can more than handle that! Even better though, we could create an AI version of the game which is able to skip every second *turn*, reducing the total number of states to only **231**!!

# How does it work?

The game works as a series of radio buttons that all have the same `name` (so that only one can be selected at a time). Each one of these buttons sits next to a `div` that displays the "game" which contains 9 `label` elements in a css-grid. The radios and "game"s are all `display: none` by default.

Each of the labels is connected to another radio button, which, when clicked, will select that radio (unselecting the current one).

All of this is tied together with a neat piece of css:

```css
input:checked + .game {
  display: grid;
}
```

This makes it so that whichever game is the next sibling of a checked radio button is displayed.

Here's an example:

```html
<!-- ... -->
<input type="radio" name="game-state" id="g2-r1">
<div class="game g2 r1">
  <label for="g2-r1"></label>
  <label for="g2-r1"></label>
  <label for="g2-r1-r3"></label>
  <label for="g2-r1-r4"></label>
  <label for="g2-r1-r5"></label>
  <label for="g2-r1-r6"></label>
  <label for="g2-r1-r7"></label>
  <label for="g2-r1-r8"></label>
  <label for="g2-r1-r9"></label>
</div>
<!-- ... -->
```

Here we have a game where red has played in position 2, and green has played in position 3:

![](https://i.imgur.com/6k0bITJ.png)

As described, each position is a label that links to another radio button that displays another state.

Coloring squares is done with another neat piece of CSS

```css
.game.r1 > label:nth-of-type(1),
.game.r2 > label:nth-of-type(2),
.game.r3 > label:nth-of-type(3),
.game.r4 > label:nth-of-type(4),
.game.r5 > label:nth-of-type(5),
.game.r6 > label:nth-of-type(6),
.game.r7 > label:nth-of-type(7),
.game.r8 > label:nth-of-type(8),
.game.r9 > label:nth-of-type(9)
{
  background: red;
  cursor: not-allowed;
}

.game.g1 > label:nth-of-type(1),
.game.g2 > label:nth-of-type(2),
.game.g3 > label:nth-of-type(3),
.game.g4 > label:nth-of-type(4),
.game.g5 > label:nth-of-type(5),
.game.g6 > label:nth-of-type(6),
.game.g7 > label:nth-of-type(7),
.game.g8 > label:nth-of-type(8),
.game.g9 > label:nth-of-type(9)
{
  background: green;
  cursor: not-allowed;
}
```

That's it!

The rest is simply a [script](./scripts/build-html.js) that generates all the unique states and from each state, what other states it links to!

# But how does the computer make moves?

Very similar to the 2-player example, the script that builds the "AI" version of the game does something slightly different.

We only create "states" for every second move because each time we are looking at "what are the next moves the player can make here" we also calculate, "what will the computer do in response to that move?".

There's no need to create a state for every possible move the computer *might* make because we already know which **1** move it will make in response to each player move!

The computers choices are pretty [simple](./scripts/build-ai-html.js). It's first two moves are hardcoded (take the middle if possible, take a corner if not).

After that it simply checks:

* If there is a move you can make to win: do that
* If there is a move the opponent could make to win: do that (block)
* Else, play the first empty square (it's not going to make a difference to winning at this point)

# Okay, sure... But why?

Some things are just worth doing for the sake of doing them and proving to yourself that they are possible!

Also, now no one can complain about the size of my bundles!
