import Page from '@root/components/page';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import React, { useEffect, useRef } from 'react';

const SkillTree = () => {
  const container = useRef(null);

  useEffect(() => {
    if (container.current) {
      cytoscape.use(dagre);

      const cy = cytoscape({
        container: container.current,
        //disable dragging

        userPanningEnabled: false,
        userZoomingEnabled: false,
        boxSelectionEnabled: false,

        elements: [

          // chapter 1 nodes
          { data: { id: 'learning', label: 'Chapter 1. Learning' } },
          { data: { id: 'essence', label: 'Essence' } },
          { data: { id: 'holes', label: 'Holes' } },
          { data: { id: 'locks', label: 'Locks' } },

          // create node Soil Survey, Fish Eye, and Breaking In
          { data: { id: 'soilSurvey', label: 'Soil Survey' } },
          { data: { id: 'fishEye', label: 'Fish Eye' } },
          { data: { id: 'breakingIn', label: 'Breaking In' } },

          // chapter 2 nodes
          // create nodes for Renovations, Moon, Factory, Linked Locks, Tricks, Out of Reach, Pipelining 101, Time Capsule, Knot, Fleur, Light Snack, Scrimmage, Precipice Blade, Smokestack, Clearing Out
          { data: { id: 'renovations', label: 'Chapter 2. Renovations' } },
          { data: { id: 'moon', label: 'Moon' } },
          { data: { id: 'factory', label: 'Factory' } },
          { data: { id: 'linkedLocks', label: 'Linked Locks' } },
          { data: { id: 'tricks', label: 'Tricks' } },
          { data: { id: 'outOfReach', label: 'Out of Reach' } },
          { data: { id: 'pipelining101', label: 'Pipelining 101' } },
          { data: { id: 'timeCapsule', label: 'Time Capsule' } },
          { data: { id: 'knot', label: 'Knot' } },
          { data: { id: 'fleur', label: 'Fleur' } },
          { data: { id: 'lightSnack', label: 'Light Snack' } },
          { data: { id: 'scrimmage', label: 'Scrimmage' } },
          { data: { id: 'precipiceBlade', label: 'Precipice Blade' } },
          { data: { id: 'smokestack', label: 'Smokestack' } },
          { data: { id: 'clearingOut', label: 'Clearing Out' } },

          // chapter 3 nodes
          // create nodes for Chapter 3: Mosaic, Gnarly Scars, The Machine, Pipelining 102, Displacement, Line Up, The Classics, Gold Collection, Suspended, QPU, Kitchen Sink, Bottle, Cross, The Invasion, SMG, Cairns
          { data: { id: 'mosaic', label: 'Chapter 3: Mosaic' } },
          { data: { id: 'gnarlyScars', label: 'Gnarly Scars' } },
          { data: { id: 'theMachine', label: 'The Machine' } },
          { data: { id: 'pipelining102', label: 'Pipelining 102' } },
          { data: { id: 'displacement', label: 'Displacement' } },
          { data: { id: 'lineUp', label: 'Line Up' } },
          { data: { id: 'theClassics', label: 'The Classics' } },
          { data: { id: 'goldCollection', label: 'Gold Collection' } },
          { data: { id: 'suspended', label: 'Suspended' } },
          { data: { id: 'qpu', label: 'QPU' } },
          { data: { id: 'kitchenSink', label: 'Kitchen Sink' } },
          { data: { id: 'bottle', label: 'Bottle' } },
          { data: { id: 'cross', label: 'Cross' } },
          { data: { id: 'theInvasion', label: 'The Invasion' } },
          { data: { id: 'smg', label: 'SMG' } },
          { data: { id: 'cairns', label: 'Cairns' } },

          // main branches are learning, essence, holes, renovations, linkedLocks, tricks ,  out of reach, and intro to pipelining, and time capsule, light snack
          // create edges for main branches to connect linearly
          { data: { id: 'learningEssence', source: 'learning', target: 'essence' } },
          { data: { id: 'essenceHoles', source: 'essence', target: 'holes' } },
          { data: { id: 'holesLocks', source: 'holes', target: 'locks' } },

          { data: { id: 'renovationsLinkedLocks', source: 'renovations', target: 'linkedLocks' } },

          { data: { id: 'linkedLocksTricks', source: 'linkedLocks', target: 'tricks' } },
          { data: { id: 'tricksOutOfReach', source: 'tricks', target: 'outOfReach' } },
          { data: { id: 'outOfReachPipelining101', source: 'outOfReach', target: 'pipelining101' } },
          { data: { id: 'pipelining101TimeCapsule', source: 'pipelining101', target: 'timeCapsule' } },
          { data: { id: 'timeCapsuleLightSnack', source: 'timeCapsule', target: 'lightSnack' } },

          // soil survey is branched from holes
          { data: { id: 'holesSoilSurvey', source: 'holes', target: 'soilSurvey' } },
          // fish eye is branched from locks
          { data: { id: 'locksFishEye', source: 'locks', target: 'fishEye' } },
          // breaking in is branched from locks
          { data: { id: 'locksBreakingIn', source: 'locks', target: 'breakingIn' } },

          // breaking in and fish eye target renovations
          { data: { id: 'breakingInRenovations', source: 'breakingIn', target: 'renovations' } },
          { data: { id: 'fishEyeRenovations', source: 'fishEye', target: 'renovations' } },

          // moon and factory is branched from renovations
          { data: { id: 'renovationsMoon', source: 'renovations', target: 'moon' } },
          { data: { id: 'renovationsFactory', source: 'renovations', target: 'factory' } },

          // knot and fleur are branched from time capsule
          { data: { id: 'timeCapsuleKnot', source: 'timeCapsule', target: 'knot' } },
          { data: { id: 'timeCapsuleFleur', source: 'timeCapsule', target: 'fleur' } },

          // line of scrimmage and precipice blade, and smokestack, clearing out are branched from light snack
          { data: { id: 'lightSnackScrimmage', source: 'lightSnack', target: 'scrimmage' } },
          { data: { id: 'lightSnackPrecipiceBlade', source: 'lightSnack', target: 'precipiceBlade' } },
          { data: { id: 'lightSnackSmokestack', source: 'lightSnack', target: 'smokestack' } },
          { data: { id: 'lightSnackClearingOut', source: 'lightSnack', target: 'clearingOut' } },

          // have scrimmage, precipice blade, smokestack, clearing out target Chapter 3: Mosaic
          { data: { id: 'scrimmageMosaic', source: 'scrimmage', target: 'mosaic', } },
          { data: { id: 'precipiceBladeMosaic', source: 'precipiceBlade', target: 'mosaic' } },
          { data: { id: 'smokestackMosaic', source: 'smokestack', target: 'mosaic' } },
          // then have mosaic target gnarly scars and the machine
          { data: { id: 'mosaicGnarlyScars', source: 'mosaic', target: 'gnarlyScars' } },
          { data: { id: 'mosaicTheMachine', source: 'mosaic', target: 'theMachine' } },
          // have the machine target pieplining 102,
          { data: { id: 'theMachinePipelining102', source: 'theMachine', target: 'pipelining102' } },
          // have pipelining 102 target displacement and line up and The Classics
          { data: { id: 'pipelining102Displacement', source: 'pipelining102', target: 'displacement' } },
          { data: { id: 'pipelining102LineUp', source: 'pipelining102', target: 'lineUp' } },
          { data: { id: 'pipelining102TheClassics', source: 'pipelining102', target: 'theClassics' } },
          // have the classics target gold collection and suspended
          { data: { id: 'theClassicsGoldCollection', source: 'theClassics', target: 'goldCollection' } },
          { data: { id: 'theClassicsSuspended', source: 'theClassics', target: 'suspended' } },
          // have suspended target qpu and kitchen sink
          { data: { id: 'suspendedQpu', source: 'suspended', target: 'qpu' } },
          { data: { id: 'suspendedKitchenSink', source: 'suspended', target: 'kitchenSink' } },
          // have kitchen sink target bottle, cross, the invasion, smg, and cairns
          { data: { id: 'kitchenSinkBottle', source: 'kitchenSink', target: 'bottle' } },
          { data: { id: 'kitchenSinkCross', source: 'kitchenSink', target: 'cross' } },
          { data: { id: 'kitchenSinkTheInvasion', source: 'kitchenSink', target: 'theInvasion' } },
          { data: { id: 'kitchenSinkSmg', source: 'kitchenSink', target: 'smg' } },
          { data: { id: 'kitchenSinkCairns', source: 'kitchenSink', target: 'cairns' } },

          //
        ],

        style: [
          {
            selector: 'node',
            style: {
              'background-color': 'gray',
              'label': 'data(label)',
              'text-valign': 'center',
              'text-halign': 'center',
              // font color white
              'color': 'white',
              // font size
              'font-size': '16px',
              // auto size to fit label
              'width': 'label',
              // same as width
              'height': 'width',
              // make it a rectangle
              'shape': 'round-rectangle',
              // make it a little bigger
              'padding': '10px',
              // rounded corners

            } as cytoscape.Css.Node,
          },
          {
            selector: 'edge',
            style: {
              'width': 3,
              'line-color': '#ccc',
              'target-arrow-color': '#ccc',
              'target-arrow-shape': 'triangle'
            }
          }
        ],

        layout: {
          nodeDimensionsIncludeLabels: true,
          fit: true,
          name: 'dagre',
          ranker: 'tight-tree',

        } as cytoscape.LayoutOptions,

      });

      cy.nodes().ungrabify();
      // After the layout is rendered, manually adjust the position of 'renovations' node
      cy.ready(function() {
        const minY = Math.min(...cy.nodes().map(node => node.position('y')));

        cy.pan({
          x: 50,
          y: -minY + 50,
        });
      });
    }
  }, [container]);

  return (<Page>
    <div ref={container} style={{ width: '100%', height: '1600px' }} />
  </Page>);
};

export default SkillTree;
