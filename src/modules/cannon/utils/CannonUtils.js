import CannonGame from "../model/CannonGame";
import GameUtils from "../../../core/utils/GameUtils";
var _ = require('lodash');

/**
 * This class contians all util functions necassary for the UI
 * and other calculations for the Cannon game
 * 
 * @extends GameUtils
 * 
 * @author cant12
 */

class CannonUtils extends GameUtils {

    static NUM_ROWS = 8;
    static NUM_COLUMNS = 8;

    static INITIAL_GAME_STATE = [
        ['Tw', 'W', 'Tw', 'W', 'Tw', 'W', 'Tw', 'W'],
        ['E', 'W', 'E', 'W', 'E', 'W', 'E', 'W'],
        ['E', 'W', 'E', 'W', 'E', 'W', 'E', 'W'],
        ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E'],
        ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E'],
        ['B', 'E', 'B', 'E', 'B', 'E', 'B', 'E'],
        ['B', 'E', 'B', 'E', 'B', 'E', 'B', 'E'],
        ['B', 'Tb', 'B', 'Tb', 'B', 'Tb', 'B', 'Tb']
    ];

    static INITIAL_GUIDE_STATE = {
        targetsMarkerState: [
            ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
            ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
            ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
            ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
            ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
            ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
            ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
            ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N']
        ],
        selectedPosition: null
    };

    static isPositionValid(position) {
        return (position[0] >= 0 && position[0] < this.NUM_ROWS &&
            position[1] >= 0 && position[1] < this.NUM_COLUMNS);
    }

    static addPositions(positionA, positionB) {
        return [positionA[0] + positionB[0], positionA[1] + positionB[1]];
    }

    static substractPositions(positionA, positionB) {
        return [positionA[0] - positionB[0], positionA[1] - positionB[1]];
    }

    static multiplyPositionWithScalar(scalar, position) {
        return [scalar * position[0], scalar * position[1]];
    }

    constructor() {
        super();
    }

    /**
     * @override
     */
    getInitialGameState() {
        return _.cloneDeep(CannonUtils.INITIAL_GAME_STATE);
    }

    /**
     * @override
     */
    getInitialGuideState() {
        return  _.cloneDeep(CannonUtils.INITIAL_GUIDE_STATE);
    }

    /**
     * @override
     */
    convertMoveStringToDict(move) {
        const moveDict = {
            type: move[6],
            selectedPosition: [parseInt(move[2]), parseInt(move[4])],
            targetPosition: [parseInt(move[8]), parseInt(move[10])]
        };
        return moveDict;
    }

    /**
     * @override
     */
    convertMoveDictToString(moveDict) {
        return "S " + moveDict.selectedPosition[0] + " " + moveDict.selectedPosition[1] + " " +
            moveDict.type + " " + moveDict.targetPosition[0] + " " + moveDict.targetPosition[1];
    }
    
    /**
     * gets a guide state after selection
     * 
     * @param {list} gameState 
     * @param {list} selectedPosition 
     */
    getGuideStateAfterSelection(gameState, selectedPosition) {
        const game = new CannonGame(gameState);
        const piece = game.getPiece(selectedPosition);
        if(piece  !== 'B' && piece !== 'W') {
            return this.getInitialGuideState();
        }

        // cannon moves
        const rearCannons = game.getCannonsWithRearPosition(selectedPosition);
        let moveTargets = game.getCannonMoveTargets(rearCannons);
        let bombTargets = game.getBombTargets(rearCannons);

        const middleCannons = game.getCannonsWithMiddlePosition(selectedPosition);
        bombTargets = bombTargets.concat(game.getBombTargets(middleCannons));

        // soldier moves
        moveTargets = moveTargets.concat(game.getSoldierMoveTargets(selectedPosition));

        const guideState = this.getInitialGuideState();
        for (let position of moveTargets) {
            guideState.targetsMarkerState[position[0]][position[1]] = 'D';
        }
        for (let position of bombTargets) {
            guideState.targetsMarkerState[position[0]][position[1]] = 'R';
        }
        guideState.selectedPosition = selectedPosition;

        return guideState;
    }

    /**
     * @override
     */
    isMoveValid(gameState, isBlackTurn, moveDict) {
        const currentPiece = isBlackTurn ? 'B' : 'W';
        if (!CannonUtils.isPositionValid(moveDict.selectedPosition) || !CannonUtils.isPositionValid(moveDict.targetPosition)) {
            return false;
        }
        if (gameState[moveDict.selectedPosition[0]][moveDict.selectedPosition[1]] !== currentPiece) {
            return false;
        }
        const guideState = this.getGuideStateAfterSelection(gameState, moveDict.selectedPosition);
        if (moveDict.type === 'M') {
            return guideState.targetsMarkerState[moveDict.targetPosition[0]][moveDict.targetPosition[1]] === 'D';
        } else if (moveDict.type === 'B') {
            return guideState.targetsMarkerState[moveDict.targetPosition[0]][moveDict.targetPosition[1]] === 'R';
        } else {
            return false;
        }
    }

    /**
     * @override
     */
    getGameStateAfterMove(gameState, moveDict) {
        const game = new CannonGame(gameState);

        if (moveDict.type === 'M') {
            return game.getStateAfterMove(moveDict.selectedPosition, moveDict.targetPosition);
        } else {
            return game.getStateAfterBomb(moveDict.targetPosition);
        }
    }

    /**
     * @override
     */
    getGameConditionIfOver(currentGameCondition, gameState, isBlackTurn) {
        let numBlackTownhalls = 0;
        let numWhiteTownhalls = 0;
        for (let row of gameState) {
            for (let square of row) {
                if (square === 'Tb') {
                    numBlackTownhalls++;
                }
                if (square === 'Tw') {
                    numWhiteTownhalls++;
                }
            }
        }
        if (numBlackTownhalls <= 2) {
            return GameUtils.GAME_CONDITION.WHITE_WINS;
        }
        if (numWhiteTownhalls <= 2) {
            return GameUtils.GAME_CONDITION.BLACK_WINS;
        }

        let soldier = isBlackTurn ? 'B' : 'W';
        for (let i = 0; i < CannonUtils.NUM_ROWS; i++) {
            for (let j = 0; j < CannonUtils.NUM_COLUMNS; j++) {
                if (gameState[i][j] === soldier) {
                    let newGuideState = this.getGuideStateAfterSelection(gameState, [i, j]);
                    if (JSON.stringify(newGuideState) !== JSON.stringify(this.getInitialGuideState())) {
                        return currentGameCondition;
                    }
                }
            }
        }

        return GameUtils.GAME_CONDITION.STALEMATE;
    }

    /**
     * @override
     */
    getGuideStateForMoveAnimation(moveDict) {
        const guideState = this.getInitialGuideState();
        if(moveDict.type==='M') {
            guideState.targetsMarkerState[moveDict.targetPosition[0]][moveDict.targetPosition[1]] = 'D';
        } else {
            guideState.targetsMarkerState[moveDict.targetPosition[0]][moveDict.targetPosition[1]] = 'R';
        }
        guideState.selectedPosition = moveDict.selectedPosition;
        return guideState;
    }
}

export default CannonUtils;