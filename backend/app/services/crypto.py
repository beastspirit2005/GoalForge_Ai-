import hashlib
import json
import time
import os
from typing import Any

# Path for the mock blockchain
CHAIN_DATA_FILE = "mock_blockchain.json"

class MockBlockchain:
    def __init__(self):
        self.chain = []
        self.current_transactions = []
        self._load_chain()

    def _load_chain(self):
        if os.path.exists(CHAIN_DATA_FILE):
            with open(CHAIN_DATA_FILE, "r") as f:
                try:
                    data = json.load(f)
                    self.chain = data.get("chain", [])
                except json.JSONDecodeError:
                    self._create_genesis_block()
        else:
            self._create_genesis_block()

    def _save_chain(self):
        with open(CHAIN_DATA_FILE, "w") as f:
            json.dump({"chain": self.chain}, f, indent=4)

    def _create_genesis_block(self):
        if not self.chain:
            self.new_block(previous_hash="1", proof=100)

    def new_block(self, proof: int, previous_hash: str | None = None) -> dict:
        """Create a new Block in the Blockchain"""
        block = {
            'index': len(self.chain) + 1,
            'timestamp': time.time(),
            'transactions': self.current_transactions,
            'proof': proof,
            'previous_hash': previous_hash or self.hash(self.chain[-1] if self.chain else {}),
        }
        self.current_transactions = []
        self.chain.append(block)
        self._save_chain()
        return block

    def new_transaction(self, sender: str, recipient: str, amount: float, memo: str = "") -> int:
        """Adds a new transaction to the list of transactions"""
        self.current_transactions.append({
            'sender': sender,
            'recipient': recipient,
            'amount': amount,
            'memo': memo,
            'timestamp': time.time()
        })
        # Mock mining step - immediately mine a block for demo purposes
        last_block = self.chain[-1]
        last_proof = last_block['proof']
        proof = self.proof_of_work(last_proof)
        self.new_block(proof)
        
        return self.chain[-1]['index']

    @staticmethod
    def hash(block: dict) -> str:
        """Hashes a Block"""
        block_string = json.dumps(block, sort_keys=True).encode()
        return hashlib.sha256(block_string).hexdigest()

    def proof_of_work(self, last_proof: int) -> int:
        """Simple Proof of Work Algorithm"""
        proof = 0
        while self.valid_proof(last_proof, proof) is False:
            proof += 1
        return proof

    @staticmethod
    def valid_proof(last_proof: int, proof: int) -> bool:
        """Validates the Proof"""
        guess = f'{last_proof}{proof}'.encode()
        guess_hash = hashlib.sha256(guess).hexdigest()
        return guess_hash[:2] == "00"  # Easy difficulty for simulation

# Singleton instance
blockchain = MockBlockchain()

def issue_work_token(user_id: int, amount: float, reason: str):
    """Issues ForgeTokens to a user by recording a transaction on the blockchain."""
    recipient_address = f"user_{user_id}_wallet"
    block_index = blockchain.new_transaction(
        sender="SystemVault",
        recipient=recipient_address,
        amount=amount,
        memo=reason
    )
    return block_index

def get_wallet_balance(user_id: int) -> float:
    """Calculates the total ForgeTokens for a user from the chain."""
    recipient_address = f"user_{user_id}_wallet"
    balance = 0.0
    for block in blockchain.chain:
        for tx in block['transactions']:
            if tx['recipient'] == recipient_address:
                balance += tx['amount']
            elif tx['sender'] == recipient_address:
                balance -= tx['amount']
    return balance
